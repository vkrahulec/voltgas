export interface Station {
  id: string;
  name: string;
  type: 'ev' | 'fuel';
  lat: number;
  lng: number;
  address: string;
  price: number | null;
}
