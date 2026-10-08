import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { ClusterDB, setDbForTests, addAttack, patchAttack, deleteAttack, exportBackup, importBackup, wipeAll, db } from "@/lib/db";
import { newAttack } from "@/lib/logic";

beforeEach(async () => {
  setDbForTests(new ClusterDB("test-" + Math.random()));
});

describe("local database", () => {
  it("patches stamp updated_at and per-field times", async () => {
    const a = newAttack(new Date("2026-10-08T02:00:00"));
    await addAttack(a);
    await patchAttack(a.id, { intensity_max: 7 }, new Date("2026-10-08T03:00:00"));
    const got = await db().attacks.get(a.id);
    expect(got?.intensity_max).toBe(7);
    expect(got?.updated_at).toBe(new Date("2026-10-08T03:00:00").toISOString());
    expect(got?.recorded_fields_at.intensity_max).toBe(new Date("2026-10-08T03:00:00").toISOString());
  });

  it("delete is soft", async () => {
    const a = newAttack(new Date());
    await addAttack(a);
    await deleteAttack(a.id);
    expect((await db().attacks.get(a.id))?.deleted_at).toBeTruthy();
  });

  it("backup round-trips and newer copies win on restore", async () => {
    const a = newAttack(new Date("2026-10-08T02:00:00"));
    await addAttack(a);
    const backup = await exportBackup();
    await patchAttack(a.id, { intensity_max: 9 }, new Date("2026-10-09T02:00:00"));
    expect(await importBackup(backup)).toBe(0); // local copy is newer
    await wipeAll();
    expect(await importBackup(backup)).toBe(1);
    expect((await db().attacks.get(a.id))?.intensity_max).toBeNull();
  });

  it("rejects files that aren't backups", async () => {
    await expect(importBackup({ hello: 1 })).rejects.toThrow("isn't a Clusterlog backup");
  });
});
