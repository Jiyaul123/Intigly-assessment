import Realm from "realm";

export function detach<T>(obj: any): T | null {
  if (!obj) return null;
  try {
    return (typeof obj.toJSON === "function" ? obj.toJSON() : JSON.parse(JSON.stringify(obj))) as T;
  } catch {
    return JSON.parse(JSON.stringify(obj)) as T;
  }
}

export function detachAll<T>(col: Realm.Results<any> | any[]): T[] {
  return Array.from(col ?? []).map((o) => detach<T>(o)!) as T[];
}
