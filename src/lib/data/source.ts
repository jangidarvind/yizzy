import type { Dataset, Meta, Station } from './types';

/**
 * The single seam between the UI and where data comes from.
 *
 * Today this reads the static JSON the ETL emits. Swapping in a real backend
 * (or a per-partner scoped endpoint behind auth) means changing this file only —
 * no component imports anything else.
 */

const DATA_BASE = `${import.meta.env.BASE_URL}data`;

export async function loadDataset(): Promise<Dataset> {
  const [stations, meta] = await Promise.all([
    fetchJson<Station[]>(`${DATA_BASE}/stations.json`),
    fetchJson<Meta>(`${DATA_BASE}/meta.json`),
  ]);
  return { stations, meta };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
