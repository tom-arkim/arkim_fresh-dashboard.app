import { t } from "i18next";
import { createContext, useContext, useState } from "react";

export interface MessageType {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
};

type SidePanelChatContextType = {
    openSidePanelChat: boolean;
    setOpenSidePanelChat: (openSidePanelChat: boolean) => void;
    togglePanel: () => void;
    postMessage: (message: string) => void;
    isPostingMessage: boolean;
    messages: MessageType[];
};

const SidePanelChatContext = createContext<SidePanelChatContextType | null>(null);

export function SidePanelChatProvider({ children }: { children: React.ReactNode }) {
    const [openSidePanelChat, setOpenSidePanelChat] = useState<boolean>(false);
    const [isPostingMessage, setIsPostingMessage] = useState<boolean>(false);
    const [messages, setMessages] = useState<MessageType[]>([]);

    return <SidePanelChatContext.Provider value={{
        openSidePanelChat,
        setOpenSidePanelChat,
        togglePanel: () => {
            setOpenSidePanelChat(prev => (
                !prev
            ))
        },
        postMessage: (message: string) => {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'user',
                content: message,
                timestamp: Date.now()
            },
            {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: t('sidePanelChat.assistantDummyResponse'),
                timestamp: Date.now()
            }]);
        },
        isPostingMessage,
        messages
    }} >
        {children}
    </ SidePanelChatContext.Provider >
}

export function useSidePanelChat() {
    const context = useContext(SidePanelChatContext);
    if (!context) {
        throw new Error('useSidePanelChat must be used within a SidePanelChatProvider');
    }
    return context;
}