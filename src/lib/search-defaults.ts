import { addDays, msToIst, todayIst, HOUR_MS } from "./time.ts";
import { MIN_LEAD_HOURS } from "./search.ts";
import type { SearchDefaults } from "@/components/booking/SearchForm";
import type { Hub, RentalType } from "./types.ts";

/** Default search: tomorrow 10:00 AM, returning after the minimum days for the rental type. */
export function searchDefaults(
  hubs: Hub[],
  overrides: Partial<SearchDefaults> = {},
  now = Date.now(),
): { defaults: SearchDefaults; minDate: string } {
  const type: RentalType = overrides.type ?? "daily";
  const pd = overrides.pd ?? addDays(todayIst(now), 1);
  const minDays = type === "monthly" ? 30 : type === "weekly" ? 7 : 1;
  const defaults: SearchDefaults = {
    type,
    hub: overrides.hub && hubs.some((h) => h.id === overrides.hub) ? overrides.hub : hubs[0]?.id ?? "",
    mode: overrides.mode ?? "two-way",
    pd,
    pt: overrides.pt ?? "10:00",
    rd: overrides.rd ?? addDays(pd, minDays),
    rt: overrides.rt ?? "10:00",
  };
  return { defaults, minDate: msToIst(now + MIN_LEAD_HOURS * HOUR_MS).date };
}
