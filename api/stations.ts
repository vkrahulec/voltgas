import { IncomingMessage, ServerResponse } from 'http';
import { Station } from '@voltgas/types';

const stations: Station[] = [
  {
    id: '1',
    name: 'Shell Brno Centrum',
    type: 'gas',
    lat: 49.1951,
    lng: 16.6068,
    price: 38.9,
    address: 'Česká 10, 602 00 Brno',
  },
  {
    id: '2',
    name: 'OMV Praha Zličín',
    type: 'gas',
    lat: 50.0647,
    lng: 14.2897,
    price: 37.5,
    address: 'Řevnická 1, 155 21 Praha 5',
  },
  {
    id: '3',
    name: 'PRE EV Stanice Anděl',
    type: 'ev',
    lat: 50.0703,
    lng: 14.4031,
    price: 8.5,
    address: 'Nádražní 23, 150 00 Praha 5',
  },
];

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(stations));
}
