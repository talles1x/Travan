import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getTrip, seededOccupied } from './catalog';
import { departureTime } from './format';
import type { Passenger, Ticket, Trip, User } from './types';

const KEYS = { users: 'travan:users', session: 'travan:session', tickets: 'travan:tickets' };
const PIX_WINDOW_MS = 10 * 60 * 1000;
/** Cancelamento com reembolso até 3 h antes da partida */
export const CANCEL_LIMIT_MS = 3 * 60 * 60 * 1000;

type Result = { ok: true } | { ok: false; error: string };

type Store = {
  ready: boolean;
  user: User | null;
  tickets: Ticket[];
  myTickets: Ticket[];
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  occupiedSeats: (trip: Trip) => number[];
  reserve: (trip: Trip, passengers: Passenger[]) => Promise<Ticket>;
  confirmPayment: (ticketId: string) => Promise<void>;
  cancel: (ticketId: string) => Promise<Result>;
  board: (code: string, tripId: string) => Promise<Result & { ticket?: Ticket }>;
};

const StoreContext = createContext<Store | null>(null);

const hash = (value: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `travan:${value}`);

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I para não confundir
  const bytes = Crypto.getRandomBytes(6);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const save = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    (async () => {
      const [u, session, t] = await Promise.all([
        load<User[]>(KEYS.users, []),
        load<string | null>(KEYS.session, null),
        load<Ticket[]>(KEYS.tickets, []),
      ]);
      setUsers(u);
      setUser(u.find((x) => x.email === session) ?? null);
      setTickets(expirePending(t));
      setReady(true);
    })();
  }, []);

  const persistTickets = useCallback((next: Ticket[]) => {
    setTickets(next);
    save(KEYS.tickets, next);
  }, []);

  const register: Store['register'] = async ({ name, email, phone, password }) => {
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) {
      return { ok: false, error: 'Já existe uma conta com este e-mail.' };
    }
    const newUser: User = {
      name: name.trim(),
      email: normalized,
      phone,
      passwordHash: await hash(password),
      createdAt: Date.now(),
    };
    const next = [...users, newUser];
    setUsers(next);
    setUser(newUser);
    await Promise.all([save(KEYS.users, next), save(KEYS.session, normalized)]);
    return { ok: true };
  };

  const login: Store['login'] = async (email, password) => {
    const found = users.find((u) => u.email === email.trim().toLowerCase());
    if (!found || found.passwordHash !== (await hash(password))) {
      return { ok: false, error: 'E-mail ou senha incorretos.' };
    }
    setUser(found);
    await save(KEYS.session, found.email);
    return { ok: true };
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(KEYS.session);
  };

  const occupiedSeats = useCallback(
    (trip: Trip) => {
      const mine = tickets
        .filter((t) => t.tripId === trip.id && (t.status === 'confirmed' || t.status === 'boarded' || t.status === 'pending'))
        .flatMap((t) => t.passengers.map((p) => p.seat));
      return Array.from(new Set([...seededOccupied(trip), ...mine]));
    },
    [tickets],
  );

  const reserve: Store['reserve'] = async (trip, passengers) => {
    const now = Date.now();
    const ticket: Ticket = {
      id: Crypto.randomUUID(),
      code: makeCode(),
      tripId: trip.id,
      userEmail: user!.email,
      passengers,
      total: trip.price * passengers.length,
      status: 'pending',
      createdAt: now,
      expiresAt: now + PIX_WINDOW_MS,
    };
    persistTickets([ticket, ...tickets]);
    return ticket;
  };

  const update = (id: string, patch: (t: Ticket) => Ticket) =>
    persistTickets(tickets.map((t) => (t.id === id ? patch(t) : t)));

  const confirmPayment: Store['confirmPayment'] = async (ticketId) => {
    update(ticketId, (t) => ({ ...t, status: 'confirmed', paidAt: Date.now() }));
  };

  const cancel: Store['cancel'] = async (ticketId) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    const trip = ticket && getTrip(ticket.tripId);
    if (!ticket || !trip) return { ok: false, error: 'Passagem não encontrada.' };
    if (ticket.status === 'pending') {
      update(ticketId, (t) => ({ ...t, status: 'cancelled' }));
      return { ok: true };
    }
    if (departureTime(trip.date, trip.departure) - Date.now() < CANCEL_LIMIT_MS) {
      return { ok: false, error: 'O cancelamento com reembolso só é possível até 3 horas antes da partida.' };
    }
    update(ticketId, (t) => ({ ...t, status: 'cancelled' }));
    return { ok: true };
  };

  const board: Store['board'] = async (code, tripId) => {
    const ticket = tickets.find((t) => t.code === code.trim().toUpperCase());
    if (!ticket) return { ok: false, error: 'Código não encontrado.' };
    if (ticket.tripId !== tripId) return { ok: false, error: 'Esta passagem é de outra viagem.' };
    if (ticket.status === 'boarded') return { ok: false, error: 'Embarque já registrado.', ticket };
    if (ticket.status !== 'confirmed') return { ok: false, error: 'Passagem sem pagamento confirmado.', ticket };
    const boarded = { ...ticket, status: 'boarded' as const, boardedSeats: ticket.passengers.map((p) => p.seat) };
    update(ticket.id, () => boarded);
    return { ok: true, ticket: boarded };
  };

  const myTickets = useMemo(
    () => (user ? tickets.filter((t) => t.userEmail === user.email) : []),
    [tickets, user],
  );

  const value: Store = {
    ready,
    user,
    tickets,
    myTickets,
    register,
    login,
    logout,
    occupiedSeats,
    reserve,
    confirmPayment,
    cancel,
    board,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Reservas sem pagamento expiram e liberam os assentos */
function expirePending(list: Ticket[]) {
  const now = Date.now();
  return list.map((t) => (t.status === 'pending' && t.expiresAt < now ? { ...t, status: 'expired' as const } : t));
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
