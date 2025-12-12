"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";

import { catalogDb } from "@/database/drizzle-catalog";
import { locations } from "@/database/catalog-schema";

export type SelectOption = {
  value: string;
  label: string;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const CACHE_TAG = "catalog:locations";

const GetDistrictsInputSchema = z.object({
  region: z.string().trim().min(1).max(100),
});

function regionsCacheKey() {
  return `${CACHE_TAG}:regions`;
}

function districtsCacheKey(region: string) {
  return `${CACHE_TAG}:districts:${region}`;
}

async function fetchRegions(): Promise<SelectOption[]> {
  const rows = await catalogDb
    .select({ region: locations.region })
    .from(locations)
    .groupBy(locations.region)
    .orderBy(asc(locations.region));

  return rows.map((r) => ({ value: r.region, label: r.region }));
}

async function fetchDistricts(region: string): Promise<SelectOption[]> {
  const rows = await catalogDb
    .select({ district: locations.district })
    .from(locations)
    .where(eq(locations.region, region))
    .orderBy(asc(locations.district));

  return rows.map((r) => ({ value: r.district, label: r.district }));
}

export async function getRegionOptions(opts?: {
  cache?: { enabled?: boolean; revalidateSeconds?: number };
}): Promise<ActionResult<SelectOption[]>> {
  try {
    const cacheEnabled = opts?.cache?.enabled !== false;
    const revalidate = opts?.cache?.revalidateSeconds ?? 60 * 60 * 24; // 24h

    if (!cacheEnabled) {
      const data = await fetchRegions();
      return { success: true, data };
    }

    const cached = unstable_cache(fetchRegions, [regionsCacheKey()], {
      revalidate,
      tags: [CACHE_TAG, `${CACHE_TAG}:regions`],
    });

    const data = await cached();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load regions",
    };
  }
}

export async function getDistrictOptions(
  input: z.infer<typeof GetDistrictsInputSchema>,
  opts?: { cache?: { enabled?: boolean; revalidateSeconds?: number } },
): Promise<ActionResult<SelectOption[]>> {
  try {
    const parsed = GetDistrictsInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const { region } = parsed.data;

    const cacheEnabled = opts?.cache?.enabled !== false;
    const revalidate = opts?.cache?.revalidateSeconds ?? 60 * 60 * 24; // 24h

    if (!cacheEnabled) {
      const data = await fetchDistricts(region);
      return { success: true, data };
    }

    const cached = unstable_cache(() => fetchDistricts(region), [districtsCacheKey(region)], {
      revalidate,
      tags: [CACHE_TAG, `${CACHE_TAG}:districts`, `${CACHE_TAG}:districts:${region}`],
    });

    const data = await cached();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load districts",
    };
  }
}

type LocationsDataset = {
  regions: SelectOption[];
  districtsByRegion: Record<string, SelectOption[]>;
};

async function fetchLocationsDataset(): Promise<LocationsDataset> {
  const rows = await catalogDb
    .select({ region: locations.region, district: locations.district })
    .from(locations)
    .orderBy(asc(locations.region), asc(locations.district));

  const districtsByRegion: Record<string, SelectOption[]> = {};
  for (const r of rows) {
    if (!districtsByRegion[r.region]) {
      districtsByRegion[r.region] = [];
    }
    districtsByRegion[r.region].push({ value: r.district, label: r.district });
  }

  const regions = Object.keys(districtsByRegion)
    .sort((a, b) => a.localeCompare(b))
    .map((region) => ({ value: region, label: region }));

  return { regions, districtsByRegion };
}

/**
 * One-shot helper for forms:
 * - fetches all regions
 * - fetches all districts
 * - returns a map usable for Region -> District dependent selects without extra round-trips
 */
export async function getLocationsDataset(opts?: {
  cache?: { enabled?: boolean; revalidateSeconds?: number };
}): Promise<ActionResult<LocationsDataset>> {
  try {
    const cacheEnabled = opts?.cache?.enabled !== false;
    const revalidate = opts?.cache?.revalidateSeconds ?? 60 * 60 * 24; // 24h

    if (!cacheEnabled) {
      const data = await fetchLocationsDataset();
      return { success: true, data };
    }

    const cached = unstable_cache(fetchLocationsDataset, [`${CACHE_TAG}:dataset`], {
      revalidate,
      tags: [CACHE_TAG, `${CACHE_TAG}:dataset`],
    });

    const data = await cached();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load locations",
    };
  }
}

export async function revalidateLocationsCache() {
  revalidateTag(CACHE_TAG, "default");
}
