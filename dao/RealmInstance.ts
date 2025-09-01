import { realmConfig } from "@/lib/db.config";
import Realm from "realm";

let instance: Realm | null = null;

export async function openRealm(): Promise<Realm> {
  if (instance && !instance.isClosed) return instance;

  const { path, schemaVersion } = realmConfig as any;

  if (__DEV__) {
    const currentVersion = Realm.schemaVersion(path);
    if (currentVersion !== -1 && currentVersion < schemaVersion) {
      console.warn(`⚠️ Dev: Deleting Realm due to schema upgrade ${currentVersion} → ${schemaVersion}`);
      Realm.deleteFile({ path });
    }
  }

  instance = await Realm.open(realmConfig);
  console.log(`✅ Realm opened @ v${instance.schemaVersion}`);
  return instance;
}

export function closeRealm() {
  if (instance && !instance.isClosed) {
    instance.close();
    instance = null;
    console.log("🛑 Realm closed");
  }
}
