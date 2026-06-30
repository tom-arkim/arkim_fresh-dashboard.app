import { useCallback, useEffect, useRef } from 'react';

export function useBroadcast<T>(channelName: string, onMessage?: (data: T) => void) {
    const channelRef = useRef<BroadcastChannel | null>(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

    useEffect(() => {
        const channel = new BroadcastChannel(channelName);
        channelRef.current = channel;

        channel.onmessage = (e: MessageEvent<T>) => {
            onMessageRef.current?.(e.data);
        };

        return () => channel.close();
    }, [channelName]);

    const emit = useCallback((data: T) => {
        channelRef.current?.postMessage(data);
    }, []);

    return { emit };
}