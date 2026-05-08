export interface Station {
  id: string;
  name: string;
  type: 'gas' | 'ev';
  lat: number;
  lng: number;
  price: number;
  address: string;
}
