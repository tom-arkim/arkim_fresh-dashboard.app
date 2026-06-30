import { useSidePanelChat } from "@/components/contexts/SidePanelChat";
import { cn } from "@/lib/utils";
import ChatInput from "./ChatInput";
import { ArrowDownIcon, X } from "lucide-react";
import Messages from "./Messages";
import { useEffect, useRef, useState } from "react";
import { TooltipIconButton } from "@/components/ui/TooltipIconButton";
import { t } from "i18next";

export default function SidePanelChat() {
    const { openSidePanelChat, togglePanel, messages } = useSidePanelChat();
    const scrollRAFRef = useRef<number | null>(null);
    // scrollable container reference
    const containerRef = useRef<HTMLDivElement | null>(null);
    // scroll button visibility flag
    const [showScrollButton, setShowScrollButton] = useState(false);

    // handle scroll
    function handleScroll() {
        const container = containerRef.current;
        if (!container) return;
        const atBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight <=
            20;
        setShowScrollButton(!atBottom);
    }

    // scroll to bottom
    function scrollToBottom() {
        // Cancel pending scroll
        if (scrollRAFRef.current) {
            cancelAnimationFrame(scrollRAFRef.current);
        }

        // Schedule on next animation frame
        scrollRAFRef.current = requestAnimationFrame(() => {
            containerRef.current?.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth', // Instant while streaming
            });
        });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, openSidePanelChat]);

    useEffect(() => {
        return () => {
            if (scrollRAFRef.current) {
                cancelAnimationFrame(scrollRAFRef.current);
            }
        };
    }, []);

    return (
        <div
            className={cn(
                "flex flex-col bg-card border-l",
                "md:border-t md:w-[380px] md:absolute md:right-0 md:z-1 md:rounded-tl-md md:shadow-2xl",
                openSidePanelChat ? "w-full 2xl:relative 2xl:shadow-none" : "w-0 h-0 border-none"
            )}
            style={{
                overflow: openSidePanelChat ? 'visible' : 'hidden',
                height: openSidePanelChat ? '100%' : '0',
            }}
        >
            {openSidePanelChat && (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-3 border-b">
                        <h3 className="text-lg font-semibold">{t('sidePanelChat.askArkim')}</h3>
                        <button className="p-1 rounded-sm hover:bg-muted" onClick={togglePanel}>
                            <X className="size-4" />
                        </button>
                    </div>

                    <div ref={containerRef} className="flex-1 overflow-y-auto p-3" onScroll={handleScroll}>
                        <div className="flex flex-col gap-4">
                            <Messages />
                        </div>
                    </div>

                    <div className="p-3 pb-3 relative text-center">
                        {showScrollButton && (
                            <TooltipIconButton
                                tooltip="Scroll to bottom"
                                variant="outline"
                                className="!bg-background pop-up w-8 h-8 absolute -top-8 rounded-full -ml-4"
                                onClick={scrollToBottom}
                            >
                                <ArrowDownIcon />
                            </TooltipIconButton>
                        )}
                        <ChatInput />
                    </div>
                </div>
            )}
        </div>
    );
}