import type { City, Route, Trip, Vehicle, VehicleType } from './types';
import { addMinutes, toISODate } from './format';

export const cities: City[] = [
  { id: 'mon', name: 'Monteiro', uf: 'PB' },
  { id: 'sum', name: 'Sumé', uf: 'PB' },
  { id: 'sbr', name: 'Serra Branca', uf: 'PB' },
  { id: 'cg', name: 'Campina Grande', uf: 'PB' },
  { id: 'jp', name: 'João Pessoa', uf: 'PB' },
  { id: 'pat', name: 'Patos', uf: 'PB' },
];

export const vehicles: Record<VehicleType, Vehicle> = {
  van: {
    type: 'van',
    label: 'Van executiva',
    seats: 15,
    layout: [2, 1],
    amenities: ['Ar-condicionado', 'Wi-Fi', 'USB'],
  },
  micro: {
    type: 'micro',
    label: 'Micro-ônibus',
    seats: 24,
    layout: [2, 2],
    amenities: ['Ar-condicionado', 'USB'],
  },
  onibus: {
    type: 'onibus',
    label: 'Ônibus convencional',
    seats: 40,
    layout: [2, 2],
    amenities: ['Ar-condicionado', 'Banheiro', 'Bagageiro'],
  },
};

const baseRoutes: Omit<Route, 'id'>[] = [
  { from: 'mon', to: 'cg', durationMin: 170, price: 55 },
  { from: 'mon', to: 'jp', durationMin: 280, price: 85 },
  { from: 'mon', to: 'sum', durationMin: 50, price: 15 },
  { from: 'sum', to: 'cg', durationMin: 120, price: 40 },
  { from: 'sbr', to: 'cg', durationMin: 100, price: 35 },
  { from: 'cg', to: 'jp', durationMin: 120, price: 40 },
  { from: 'pat', to: 'cg', durationMin: 160, price: 55 },
  { from: 'pat', to: 'jp', durationMin: 270, price: 80 },
];

/** Cada trecho existe nos dois sentidos */
export const routes: Route[] = baseRoutes.flatMap((r) => [
  { ...r, id: `${r.from}-${r.to}` },
  { ...r, from: r.to, to: r.from, id: `${r.to}-${r.from}` },
]);

/** Grade fixa de horários: o tipo de veículo muda conforme o horário */
const schedule: { time: string; vehicle: VehicleType; factor: number }[] = [
  { time: '05:30', vehicle: 'van', factor: 1 },
  { time: '07:30', vehicle: 'onibus', factor: 0.9 },
  { time: '13:00', vehicle: 'van', factor: 1 },
  { time: '17:30', vehicle: 'micro', factor: 0.95 },
];

export const cityById = (id: string) => cities.find((c) => c.id === id)!;

export function destinationsFrom(cityId: string): City[] {
  return routes.filter((r) => r.from === cityId).map((r) => cityById(r.to));
}

export function findTrips(from: string, to: string, date: string): Trip[] {
  const route = routes.find((r) => r.from === from && r.to === to);
  if (!route) return [];
  return schedule.map((s) => buildTrip(route, date, s.time, s.vehicle, s.factor));
}

export function getTrip(id: string): Trip | undefined {
  // id = origem-destino_AAAA-MM-DD_HHMM
  const [routeId, date, hhmm] = id.split('_');
  const route = routes.find((r) => r.id === routeId);
  const time = `${hhmm?.slice(0, 2)}:${hhmm?.slice(2)}`;
  const slot = schedule.find((s) => s.time === time);
  if (!route || !slot || !date) return undefined;
  return buildTrip(route, date, slot.time, slot.vehicle, slot.factor);
}

function buildTrip(route: Route, date: string, time: string, type: VehicleType, factor: number): Trip {
  return {
    id: `${route.id}_${date}_${time.replace(':', '')}`,
    routeId: route.id,
    from: cityById(route.from),
    to: cityById(route.to),
    date,
    departure: time,
    arrival: addMinutes(time, route.durationMin),
    durationMin: route.durationMin,
    price: Math.round(route.price * factor),
    vehicle: vehicles[type],
  };
}

/**
 * Assentos já vendidos por "outros passageiros". É determinístico por viagem,
 * então o mapa é sempre o mesmo para a mesma viagem.
 */
export function seededOccupied(trip: Trip): number[] {
  let seed = 0;
  for (const ch of trip.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const ratio = 0.2 + rand() * 0.45;
  const taken: number[] = [];
  for (let s = 1; s <= trip.vehicle.seats; s++) if (rand() < ratio) taken.push(s);
  return taken;
}

/** Próximos dias disponíveis para compra */
export function nextDays(count = 14): string[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return toISODate(d);
  });
}
