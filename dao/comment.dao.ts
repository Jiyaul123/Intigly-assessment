import { AnnotationSessionDao } from "./annotation.dao";
import { openRealm } from "./RealmInstance";
import { detach, detachAll } from "./utils";

export type CommentRow = {
  _id: string;
  sessionId: string;
  text: string;
  tMillis: number;
  createdAt: string;
};

export class CommentDao {
  static async add(sessionId: string, text: string, tMillis: number) {
    const r = await openRealm();
    let out: any;
    r.write(() => {
      out = r.create("CommentData", {
        _id: `${sessionId}::c::${Date.now()}`,
        sessionId,
        text,
        tMillis: Math.round(tMillis),
        createdAt: new Date().toISOString(),
      });
      const s = r.objectForPrimaryKey("AnnotationSession", sessionId);
      if (s) (s as any).updatedAt = new Date().toISOString();
    });
    await AnnotationSessionDao.touch(sessionId);
    return detach<CommentRow>(out)!;
  }

  static async listForSession(sessionId: string) {
    const r = await openRealm();
    const rows = r.objects("CommentData").filtered("sessionId == $0", sessionId).sorted("tMillis");
    return detachAll<CommentRow>(rows);
  }

  static async listAround(sessionId: string, centerMillis: number, windowMs = 2000) {
    const r = await openRealm();
    const rows = r.objects("CommentData")
      .filtered("sessionId == $0 AND tMillis BETWEEN {$1, $2}", sessionId, centerMillis - windowMs, centerMillis + windowMs)
      .sorted("tMillis");
    return detachAll<CommentRow>(rows);
  }
}
