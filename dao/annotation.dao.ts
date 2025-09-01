import { openRealm } from "./RealmInstance";
import { detach } from "./utils";

export type AnnotationSessionRow = {
  _id: string;      
  userId: string;
  videoId: string;
  createdAt: string;
  updatedAt: string;
};

export class AnnotationSessionDao {
  static makeId(userId: string, videoId: string) {
    return `${userId}::${videoId}`;
  }

  static async getOrCreate(userId: string, videoId: string) {
    const r = await openRealm();
    const _id = this.makeId(userId, videoId);
    let row = r.objectForPrimaryKey("AnnotationSession", _id);
    if (row) return detach<AnnotationSessionRow>(row)!;

    let out: any;
    r.write(() => {
      out = r.create("AnnotationSession", {
        _id,
        userId,
        videoId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    return detach<AnnotationSessionRow>(out)!;
  }

  static async touch(sessionId: string) {
    const r = await openRealm();
    r.write(() => {
      const s = r.objectForPrimaryKey("AnnotationSession", sessionId);
      if (s) (s as any).updatedAt = new Date().toISOString();
    });
  }

  static async getById(id: string) {
    const r = await openRealm();
    return detach<AnnotationSessionRow>(r.objectForPrimaryKey("AnnotationSession", id));
  }
}
