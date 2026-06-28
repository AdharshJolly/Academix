import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(token: string | null) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const subscribersRef = useRef<Set<(msg: any) => void>>(new Set());

    useEffect(() => {
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws`;

        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                ws.send(JSON.stringify({ token }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    subscribersRef.current.forEach(cb => cb(msg));
                } catch (e) {
                    console.error("WS parse error", e);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;
            };

        } catch (e) {
            console.warn("Failed to connect WS", e);
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [token]);

    const subscribe = useCallback((callback: (msg: any) => void) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    const sendMessage = useCallback((msg: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    return { isConnected, subscribe, sendMessage };
}
