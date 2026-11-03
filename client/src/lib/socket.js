import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
  }

  return socket;
}

export function subscribeToQueue(businessId, date, onUpdate) {
  const s = getSocket();
  if (!s || !businessId || !date) return () => {};

  // Join room
  s.emit('queue:join', { businessId, date });

  // Listener
  const handler = (data) => {
    if (String(data.businessId) === String(businessId) && data.date === date) {
      onUpdate(data);
    }
  };

  s.on('queue:updated', handler);

  // Return cleanup unsubscribe function
  return () => {
    s.off('queue:updated', handler);
    s.emit('queue:leave', { businessId, date });
  };
}
