import { AnnotationSessionDao } from "./annotation.dao";
import { openRealm } from "./RealmInstance";
import { detach, detachAll } from "./utils";

export type StrokePoint = { x: number; y: number; tMillis?: number };
export type StrokeRow = {
  _id: string;
  sessionId: string;
  tStartMillis: number;
  tEndMillis?: number;
  color: string;
  width: number;
  d: string;
  points: StrokePoint[];
  createdAt: string;
};

const startsWithMove = /^\s*M\s*-?\d+(\.\d+)?\s+-?\d+(\.\d+)?/i;

export class StrokeDao {
  static async add(input: {
    sessionId: string;
    d: string; // must start with 'M x y'
    tStartMillis: number;
    tEndMillis?: number;
    color?: string;
    width?: number;
    points?: StrokePoint[];
  }) {
    if (!input.d || !startsWithMove.test(input.d)) {
      throw new Error("Stroke.d must start with 'M x y'.");
    }

    const r = await openRealm();
    let out: any;

    r.write(() => {
      out = r.create("StrokeData", {
        _id: `${input.sessionId}::s::${Date.now()}`,
        sessionId: input.sessionId,
        tStartMillis: Math.round(input.tStartMillis),
        tEndMillis: typeof input.tEndMillis === "number" ? Math.round(input.tEndMillis) : undefined,
        color: input.color ?? "#FF4B4B",
        width: input.width ?? 3,
        d: input.d,
        points: (input.points ?? []).map((p) => ({ x: p.x, y: p.y, tMillis: p.tMillis })),
        createdAt: new Date().toISOString(),
      });
      const s = r.objectForPrimaryKey("AnnotationSession", input.sessionId);
      if (s) (s as any).updatedAt = new Date().toISOString();
    });

    await AnnotationSessionDao.touch(input.sessionId);
    return detach<StrokeRow>(out)!;
  }

  static async listAll(sessionId: string) {
    const r = await openRealm();
    const rows = r.objects("StrokeData").filtered("sessionId == $0", sessionId).sorted("tStartMillis");
    return detachAll<StrokeRow>(rows);
  }

  static async listActiveAt(sessionId: string, atMillis: number) {
    const r = await openRealm();
    const rows = r.objects("StrokeData")
      .filtered(
        "sessionId == $0 AND tStartMillis <= $1 AND (tEndMillis == nil OR tEndMillis >= $1)",
        sessionId,
        Math.round(atMillis)
      )
      .sorted("tStartMillis");
    return detachAll<StrokeRow>(rows);
  }
}
