'use client'

import messagingService from '@/services/api/messagingService';
import { useState, useRef, useCallback } from 'react';

interface UseSpeechToTextReturn {
    isListening: boolean;
    transcript: string;
    isSupported: boolean;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export function useSpeechToText(): UseSpeechToTextReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isSupported = typeof window !== 'undefined' && !!window.MediaRecorder;

    const stopListening = useCallback(() => {
        mediaRecorderRef.current?.stop();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        socketRef.current?.close();

        mediaRecorderRef.current = null;
        streamRef.current = null;
        socketRef.current = null;

        setIsListening(false);
    }, []);

    const startListening = useCallback(async () => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        try {
            setError(null);

            // get mic
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            const token = await messagingService.getDeepgramToken();

            // open WebSocket with API key as subprotocol
            const socket = new WebSocket(
                `wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true`,
                ['bearer', token]
            );
            socketRef.current = socket;

            // on open: wire up mediaRecorder to send chunks
            socket.onopen = () => {
                mediaRecorder.addEventListener('dataavailable', (event) => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(event.data);
                    }
                });
                mediaRecorder.start(250);
                setIsListening(true);
            };

            // on message: parse and append
            socket.onmessage = (message) => {
                const received = JSON.parse(message.data);
                const result = received.channel?.alternatives?.[0]?.transcript;
                if (result && received.is_final) {
                    setTranscript((prev) => prev + ' ' + result);
                }
            };

            socket.onerror = () => {
                setError('Deepgram connection error. Please try again.');
                stopListening();
            };

            socket.onclose = () => {
                setIsListening(false);
            };

        } catch (err: any) {
            if (err?.name === 'NotAllowedError') {
                setError('Microphone access denied. Please enable permissions.');
            } else if (err?.name === 'NotFoundError') {
                setError('No microphone found.');
            } else {
                setError(err?.message || 'Failed to start speech recognition.');
            }
            streamRef.current?.getTracks().forEach((t) => t.stop());
        }
    }, [isSupported, stopListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript,
    };
}