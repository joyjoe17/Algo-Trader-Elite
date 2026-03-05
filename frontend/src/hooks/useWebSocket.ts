import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Position, ScanResult, TradeSummary } from '../types';

interface WSState {
  connected: boolean;
  positions: Position[];
  scanResults: ScanResult[];
  summary: TradeSummary | null;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WSState>({
    connected: false,
    positions: [],
    scanResults: [],
    summary: null,
  });

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState(s => ({ ...s, connected: true }));
      socket.emit('request_positions');
    });
    socket.on('disconnect', () => setState(s => ({ ...s, connected: false })));
    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    socket.on('positions_update', (data: { positions: Position[]; summary: TradeSummary }) => {
      setState(s => ({ ...s, positions: data.positions, summary: data.summary }));
    });

    socket.on('scan_results', (data: { results: ScanResult[] }) => {
      setState(s => ({ ...s, scanResults: data.results }));
    });

    return () => { socket.disconnect(); };
  }, []);

  const requestScan = () => socketRef.current?.emit('request_scan');
  const requestPositions = () => socketRef.current?.emit('request_positions');

  return { ...state, requestScan, requestPositions };
}
