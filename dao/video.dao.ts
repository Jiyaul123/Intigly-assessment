import { openRealm } from "./RealmInstance";
import { detach } from "./utils";

export type VideoRow = {
  _id: string;
  uri: string;
  title: string;
  durationMillis?: number;
  createdAt: string;
};

export class VideoDao {
  static async ensure(uri: string, opts?: { _id?: string; title?: string; durationMillis?: number }) {
    const r = await openRealm();
    let row = r.objects("VideoData").filtered("uri == $0", uri)[0];
    if (row) return detach<VideoRow>(row)!;

    let out: any;
    r.write(() => {
      out = r.create("VideoData", {
        _id: opts?._id ?? uri,
        uri,
        title: opts?.title ?? "",
        durationMillis: opts?.durationMillis ?? undefined,
        createdAt: new Date().toISOString(),
      });
    });
    return detach<VideoRow>(out)!;
  }

  static async getById(id: string) {
    const r = await openRealm();
    return detach<VideoRow>(r.objectForPrimaryKey("VideoData", id));
  }
}
