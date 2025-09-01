import Realm from "realm";
import { openRealm } from "./RealmInstance";
import { detach, detachAll } from "./utils";

export type JPUserRow = {
  _id: string;
  remoteId: number;
  name: string;
  email: string;
  createdAt: string;
};

export class JPUserDao {
  static async upsert(
    user: Omit<JPUserRow, "createdAt"> & Partial<Pick<JPUserRow, "createdAt">>
  ) {
    const r = await openRealm();
    let out: any;
    r.write(() => {
      out = r.create(
        "JPUser",
        {
          avatarUrl: "",
          createdAt: user.createdAt ?? new Date().toISOString(),
          ...user,
        },
        Realm.UpdateMode.Modified
      );
    });
    return detach<JPUserRow>(out)!;
  }

  static async getById(id: string) {
    const r = await openRealm();
    return detach<JPUserRow>(r.objectForPrimaryKey("JPUser", id));
  }

  static async getByRemoteId(remoteId: number) {
    const r = await openRealm();
    const row = r.objects("JPUser").filtered("remoteId == $0", remoteId)[0];
    return detach<JPUserRow>(row);
  }

  static async listAll() {
    const r = await openRealm();
    const rows = r.objects("JPUser").sorted("name");
    return detachAll<JPUserRow>(rows);
  }
}
