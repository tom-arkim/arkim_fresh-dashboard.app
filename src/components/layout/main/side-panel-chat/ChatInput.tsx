import { useSidePanelChat } from "@/components/contexts/SidePanelChat";
import { TooltipIconButton } from "@/components/ui/TooltipIconButton";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { cn } from "@/lib/utils";
import MessengerService from "@/services/ui/messengerService";
import { t } from "i18next";
import { MicIcon, SendHorizontalIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// max height lines for textarea to limit the resize height and make it scrollable
const MAX_HEIGHT_LINES = 5;

export default function ChatInput() {
    // input field reference
    const inputRef = useRef<HTMLInputElement>(null);
    // mirror span reference for width matching
    const mirrorRef = useRef<HTMLSpanElement>(null);
    // text area reference
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    // input content overflow state flag
    const [overflow, setOverflow] = useState(false);
    // text area value
    const [value, setValue] = useState('');
    // speech to text hook
    const { isListening, transcript, isSupported, error, startListening, stopListening, resetTranscript } = useSpeechToText();
    // chat util
    const { postMessage } = useSidePanelChat();

    function handleTextareaResize() {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // reset height for accurate scrollHeight calculation
        textarea.style.height = 'auto';

        // calculate max height
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight || '20', 10);
        const maxHeight = lineHeight * MAX_HEIGHT_LINES;

        // set the new height, capping it
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;

        // manage overflow scrollbar visibility
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    // check overflow of the inital input content
    function checkOverflow() {
        if (overflow) return;
        if (!inputRef.current || !mirrorRef.current || !textareaRef.current) return;

        mirrorRef.current.textContent =
            inputRef.current.value || " "; // avoid zero-width
        setOverflow(
            mirrorRef.current.scrollWidth > inputRef.current.clientWidth
        );
    }

    // send message to backend
    function handlePostMessage() {
        postMessage(value);
        setValue('');
    }

    // send message on enter press
    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
        if (e.key === 'Enter' && e.shiftKey && value != '') {
            e.preventDefault();
            setOverflow(true);
            setValue(v => v + '\n');
        }
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handlePostMessage()
        }
    };

    // toggle microphone button to start/stop recording
    function toggleMicrophone() {
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            startListening();
        }
    }

    // append transcript to textarea value and trigger resize
    useEffect(() => {
        if (transcript) {
            setValue((prev: string) => {
                const newValue = prev + transcript;
                return newValue;
            });
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    // show error toast if speech recognition fails
    useEffect(() => {
        if (error) {
            MessengerService.error(t('sidePanelChat.sttError'), error)
        }
    }, [error]);

    // focus respective input field as per overflow state
    useEffect(() => {
        if (!overflow) {
            inputRef.current?.focus();
        } else {
            textareaRef.current?.focus();
        }
    }, [overflow]);

    // update the input field as per value and resize textarea
    useEffect(() => {
        if (value === '' || value === null) {
            setOverflow(false);
            if (mirrorRef && mirrorRef.current) mirrorRef.current.textContent = ' ';
        }
        checkOverflow();
        requestAnimationFrame(() => {
            handleTextareaResize();
        });
    }, [value]);

    return (
        <div aria-disabled={false} className={cn(
            'overflow-hidden focus-within:border-primary hover:border-primary w-full py-3 px-1.5 transition-colors ease-in rounded-md border border-muted bg-card',
        )}>
            <div className={cn(
                'flex flex-row items-center',
                overflow && 'flex-col'
            )}>
                <div className={cn(
                    'w-full relative',
                    overflow ? 'textarea-slide-up' : 'textarea-slide-down'
                )}>
                    {/* initial input field */}
                    <input ref={inputRef}
                        spellCheck
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        id="input-msg"
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('sidePanelChat.inputPlaceholder')}
                        className={cn(
                            'w-full p-1.5 placeholder:text-muted-foreground resize-none border-none bg-transparent text-sm outline-none focus:ring-0 disabled:cursor-not-allowed',
                            overflow && value != '' ? ' hidden' : 'block'
                        )} />
                    {/* input content width checker container */}
                    <span
                        ref={mirrorRef}
                        className="absolute top-0 left-0 whitespace-pre wrap-anywhere invisible p-1.5 text-sm"
                    />
                    {/* textarea field */}
                    <textarea
                        spellCheck
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        id="textarea-msg"
                        ref={textareaRef}
                        value={value}
                        rows={1}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('sidePanelChat.inputPlaceholder')}
                        className={cn(
                            'w-full p-1.5 placeholder:text-muted-foreground resize-none border-none bg-transparent text-sm outline-none focus:ring-0 disabled:cursor-not-allowed',
                            overflow && value != '' ? 'block' : 'hidden'
                        )}
                    />
                </div>

                <div className={cn(
                    'flex flex-row items-center justify-end gap-2',
                    overflow ? 'w-full mt-2' : ''
                )}>
                    {isSupported && (
                        <TooltipIconButton
                            tooltip={isListening ? "Recording... Press to stop" : "Press to record"}
                            variant={isListening ? "destructive" : "outline"}
                            className={cn(
                                "size-8 transition-all ease-in",
                                isListening && "animate-pulse"
                            )}
                            onClick={toggleMicrophone}
                        >
                            <MicIcon />
                            {isListening && (
                                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
                            )}

                        </TooltipIconButton>
                    )}
                    <TooltipIconButton
                        tooltip="Send"
                        variant="default"
                        className="size-8 transition-opacity ease-in"
                        onClick={() => { handlePostMessage() }}
                        disabled={!value.trim()}
                    >
                        <SendHorizontalIcon />
                    </TooltipIconButton>
                </div>
            </div>
        </div>
    );
}