export type City = {
  id: string;
  name: string;
  uf: string;
};

export type VehicleType = 'van' | 'micro' | 'onibus';

export type Vehicle = {
  type: VehicleType;
  label: string;
  seats: number;
  /** assentos por fileira, separados pelo corredor: [esquerda, direita] */
  layout: [number, number];
  amenities: string[];
};

export type Route = {
  id: string;
  from: string;
  to: string;
  durationMin: number;
  price: number;
};

export type Trip = {
  id: string;
  routeId: string;
  from: City;
  to: City;
  date: string; // AAAA-MM-DD
  departure: string; // HH:MM
  arrival: string; // HH:MM
  durationMin: number;
  price: number;
  vehicle: Vehicle;
};

export type TicketStatus = 'pending' | 'confirmed' | 'boarded' | 'cancelled' | 'expired';

export type Passenger = {
  name: string;
  document: string;
  seat: number;
};

export type Ticket = {
  id: string;
  code: string;
  tripId: string;
  userEmail: string;
  passengers: Passenger[];
  total: number;
  status: TicketStatus;
  createdAt: number;
  /** limite para pagar o Pix (ms) */
  expiresAt: number;
  paidAt?: number;
  boardedSeats?: number[];
};

export type User = {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: number;
};
