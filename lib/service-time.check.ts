// Run: npx tsx lib/service-time.check.ts
import assert from "node:assert/strict";
import { calcularDiasServicio } from "./service-time";

// Same calendar day -> 0
assert.equal(calcularDiasServicio(new Date("2026-09-10T12:00:00-03:00"), new Date("2026-09-10T19:00:00-03:00")), 0);
// Late-night intake counts as its local (Chile) day, not the UTC day
assert.equal(calcularDiasServicio(new Date("2026-09-10T23:30:00-03:00"), new Date("2026-09-11T09:00:00-03:00")), 1);
// Crosses the September DST change
assert.equal(calcularDiasServicio(new Date("2026-09-01T10:00:00-04:00"), new Date("2026-09-15T10:00:00-03:00")), 14);
// Exception 1: invalid or missing dates, delivery before intake
assert.equal(calcularDiasServicio(new Date("invalid"), new Date()), null);
assert.equal(calcularDiasServicio(new Date(), null), null);
assert.equal(calcularDiasServicio(new Date("2026-09-15"), new Date("2026-09-10")), null);

console.log("service-time: ok");
