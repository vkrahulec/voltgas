import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Station } from '@voltgas/types';

interface OCMAddressInfo {
  Title: string;
  AddressLine1: string | null;
  Latitude: number;
  Longitude: number;
}

interface OCMPoi {
  ID: number;
  AddressInfo: OCMAddressInfo;
}

interface TomTomPoi {
  name: string;
}

interface TomTomAddress {
  freeformAddress: string;
}

interface TomTomPosition {
  lat: number;
  lon: number;
}

interface TomTomResult {
  id: string;
  poi: TomTomPoi;
  address: TomTomAddress;
  position: TomTomPosition;
}

interface TomTomResponse {
  results: TomTomResult[];
}

async function fetchEVStations(lat: string, lng: string): Promise<Station[]> {
  const key = process.env.OCM_API_KEY;
  const url = `https://api.openchargemap.io/v3/poi/?latitude=${lat}&longitude=${lng}&distance=10&distanceunit=km&maxresults=50&output=json&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as OCMPoi[];
  return data.map((poi) => ({
    id: `ev-${poi.ID}`,
    name: poi.AddressInfo.Title,
    type: 'ev',
    lat: poi.AddressInfo.Latitude,
    lng: poi.AddressInfo.Longitude,
    address: poi.AddressInfo.AddressLine1 ?? '',
    price: null,
  }));
}

async function fetchFuelStations(lat: string, lng: string): Promise<Station[]> {
  const key = process.env.TOMTOM_API_KEY;
  const url = `https://api.tomtom.com/search/2/nearbySearch/.json?lat=${lat}&lon=${lng}&radius=10000&categorySet=7311&limit=50&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as TomTomResponse;
  return data.results.map((r) => ({
    id: `fuel-${r.id}`,
    name: r.poi.name,
    type: 'fuel',
    lat: r.position.lat,
    lng: r.position.lon,
    address: r.address.freeformAddress,
    price: null,
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lat, lng, type } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query params are required' });
  }

  const latStr = Array.isArray(lat) ? lat[0] : lat;
  const lngStr = Array.isArray(lng) ? lng[0] : lng;
  const typeParam = Array.isArray(type) ? type[0] : type;

  const fetchEV = typeParam === undefined || typeParam === 'ev';
  const fetchFuel = typeParam === undefined || typeParam === 'fuel';

  const [evStations, fuelStations] = await Promise.all([
    fetchEV ? fetchEVStations(latStr, lngStr) : Promise.resolve<Station[]>([]),
    fetchFuel ? fetchFuelStations(latStr, lngStr) : Promise.resolve<Station[]>([]),
  ]);

  return res.status(200).json([...evStations, ...fuelStations]);
}
