import { useQuery } from '@tanstack/react-query';
import type { Station } from '@voltgas/types';

async function fetchStations(
  lat: number,
  lng: number,
  type?: 'ev' | 'fuel',
): Promise<Station[]> {
  const base = process.env.EXPO_PUBLIC_API_URL;
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    ...(type !== undefined ? { type } : {}),
  });
  const res = await fetch(`${base}/api/stations?${params}`);
  if (!res.ok) throw new Error('Failed to fetch stations');
  return res.json() as Promise<Station[]>;
}

export function useStations(lat: number, lng: number, type?: 'ev' | 'fuel') {
  return useQuery<Station[]>({
    queryKey: ['stations', lat, lng, type],
    queryFn: () => fetchStations(lat, lng, type),
    staleTime: 5 * 60 * 1000,
  });
}
