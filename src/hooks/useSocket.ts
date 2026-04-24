'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Telemetry, Alert } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.5-252-52-19.sslip.io';

export function useSocket(droneSn?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(BASE, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (droneSn) socket.emit('subscribe:drone', droneSn);

    socket.on('telemetry', (data: Telemetry) => setTelemetry(data));
    socket.on('alert',     (data: Alert)     => setAlerts(prev => [data, ...prev].slice(0, 50)));

    return () => { socket.disconnect(); };
  }, [droneSn]);

  return { telemetry, alerts, connected, socket: socketRef.current };
}
