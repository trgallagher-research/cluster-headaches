// IndexedDB via Dexie: the local source of truth (app-plan.md §7).
import Dexie, { type EntityTable } from "dexie";
import { Attack, Settings, DEFAULT_SETTINGS } from "./model";
import { stamp } from "./logic";

export class ClusterDB extends Dexie {
  attacks!: EntityTable<Attack, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor(name = "clusterlog") {
    super(name);
    this.version(1).stores({
      attacks: "id, started_at, updated_at",
      settings: "id",
    });
  }
}

let _db: ClusterDB | null = null;
export function db(): ClusterDB {
  if (!_db) _db = new ClusterDB();
  return _db;
}
export function setDbForTests(d: ClusterDB) {
  _db = d;
}

export async function addAttack(a: Attack): Promise<void> {
  await db().attacks.put(a);
}

export async function patchAttack(id: string, patch: Partial<Attack>, now = new Date()): Promise<void> {
  await db().transaction("rw", db().attacks, async () => {
    const a = await db().attacks.get(id);
    if (!a) return;
    await db().attacks.put({ ...a, ...stamp(patch, now, a) });
  });
}

export async function deleteAttack(id: string, now = new Date()): Promise<void> {
  await patchAttack(id, { deleted_at: now.toISOString() }, now);
}

/** Hard-delete a just-created attack (the 10-second "wrong tap? undo"). */
export async function undoAttack(id: string): Promise<void> {
  await db().attacks.delete(id);
}

export async function getSettings(): Promise<Settings> {
  return (await db().settings.get("settings")) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings();
  await db().settings.put({ ...cur, ...patch, id: "settings" });
}

export interface Backup {
  app: "clusterlog";
  version: 1;
  exported_at: string;
  attacks: Attack[];
  settings: Settings;
}

export async function exportBackup(now = new Date()): Promise<Backup> {
  return {
    app: "clusterlog",
    version: 1,
    exported_at: now.toISOString(),
    attacks: await db().attacks.toArray(),
    settings: await getSettings(),
  };
}

/** Merge a backup: per attack, the copy with the later updated_at wins. Returns rows written. */
export async function importBackup(b: unknown): Promise<number> {
  const data = b as Partial<Backup>;
  if (!data || data.app !== "clusterlog" || !Array.isArray(data.attacks)) {
    throw new Error("This file isn't a Clusterlog backup.");
  }
  let written = 0;
  await db().transaction("rw", db().attacks, async () => {
    for (const a of data.attacks as Attack[]) {
      if (!a?.id || !a.started_at) continue;
      const cur = await db().attacks.get(a.id);
      if (!cur || Date.parse(a.updated_at) > Date.parse(cur.updated_at)) {
        await db().attacks.put(a);
        written++;
      }
    }
  });
  return written;
}

export async function wipeAll(): Promise<void> {
  await db().attacks.clear();
  await db().settings.clear();
}

/** Ask the browser not to evict our data (helps on iOS; see app-plan.md §7). */
export async function requestPersist(): Promise<boolean | null> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* not supported */
  }
  return null;
}
