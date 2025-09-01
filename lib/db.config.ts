import { LocalSchemas } from "@/schema/db.schema";
import Realm from "realm";

export const realmConfig: Realm.Configuration = {
  path: "local.realm",       
  schema: LocalSchemas,       
  schemaVersion: 1,
  onMigration: (oldRealm, newRealm) => {
    console.log(`🔁 Migrating from v${oldRealm.schemaVersion} to v${newRealm.schemaVersion}`);
  },
};
