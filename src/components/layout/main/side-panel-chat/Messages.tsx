import dayjs from "dayjs";
import ResponseMaker from "@/components/ui/ResponseMaker";
import { Avatar, AvatarFallback } from "@/components/ui/shadcn/avatar";
import { useSidePanelChat } from "@/components/contexts/SidePanelChat";
import { useAuth } from "@/components/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/shadcn/tooltip";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";
import MessengerService from "@/services/ui/messengerService";
import { t } from "i18next";
export default function Messages() {
    const { postMessage, messages } = useSidePanelChat();
    const { context } = useAuth();

    // Get user initials for the avatar
    const getUserInitials = (): string => {
        if (!context?.user?.firstName) return '?';
        return `${context?.user.firstName.charAt(0)}${context?.user.lastName?.charAt(0) || ''}`;
    };
    const prompts = [
        t('sidePanelChat.prompts.first'),
        t('sidePanelChat.prompts.second'),
        t('sidePanelChat.prompts.third')
    ];

    // is content copied flag
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    // handle copy content
    const handleCopy = useCallback(async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(id);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch {
            MessengerService.error('Failed to copy the content', 'Error');
        }
    }, []);

    return <>
        {
            !messages.length && prompts.map((prompt, index) => {
                return <div key={index} className="p-3 bg-muted rounded-md hover:bg-muted/60 cursor-pointer" onClick={() => postMessage(prompt)}>
                    <p className="text-xs font-medium">{prompt}</p>
                </div>
            })
        }
        {
            messages.length ?
                messages.map((message) => {
                    return <div key={message.id} className="flex flex-col my-1 gap-3">
                        <div className="flex flex-row gap-2 items-center">
                            {
                                message.role === 'assistant' ?
                                    <>
                                        <img src='arkim_logo.png' className="size-7" alt="Arkim" />
                                        <p className="text-base font-semibold">Arkim <span className="ml-1 text-sm font-normal text-muted-foreground">{dayjs(message.timestamp).fromNow()}</span></p>
                                    </> :
                                    <>
                                        <Avatar className="bg-[#84B7C8] text-black size-7 text-xs font-semibold">
                                            <AvatarFallback>{getUserInitials()}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-base font-medium">{context?.user.firstName} {context?.user.lastName} <span className="ml-1 text-sm font-normal text-muted-foreground">{dayjs(message.timestamp).fromNow()}</span></p>
                                    </>
                            }
                        </div>
                        <ResponseMaker content={message.content} />
                        <Tooltip>
                            <TooltipTrigger asChild className="w-fit">
                                {copiedMessageId === message.id ? (
                                    <button type="button">
                                        <CheckIcon className="text-foreground w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleCopy(message.content, message.id)}
                                        type="button"
                                    >
                                        <CopyIcon className="text-foreground w-4 h-4" />
                                    </button>
                                )}
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                {copiedMessageId === message.id ? "Copied!" : "Copy"}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                }) :
                null
        }
    </>
}