'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { cn } from '@/lib/utils'
import { CheckIcon, CopyIcon } from 'lucide-react'
import useCopyToClipboard from '@/hooks/use-copy-to-clipboard'
import { Button } from './shadcn/button'
import ImageViewer from './ImageViewer'

// code block header with language and code to copy
const CodeHeader = ({ language, code }: { language: any, code: any }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const onCopy = () => {
        if (!code || isCopied) return;
        copyToClipboard(code);
    };

    return (
        <div className="flex items-center justify-between px-2 mb-1 text-sm font-semibold text-foreground">
            <span className="lowercase [&>span]:text-xs">{language || 'plaintext'}</span>
            <Button variant='ghost' size='icon' onClick={onCopy}>
                {!isCopied && <CopyIcon />}
                {isCopied && <CheckIcon />}
            </Button>
        </div>
    );
};

export default function ResponseMaker({ content }: { content: string }) {
    return (
        // wrapper: strips any residual top-margin from the first child
        <div className="[&>*:first-child]:mt-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    /* ── Block elements ── */
                    pre: ({ className, ...props }) => (
                        <pre
                            className={cn(
                                'mb-3 last:mb-0 overflow-x-auto rounded bg-muted p-2 text-foreground',
                                '!max-w-[70dvw] sm:!max-w-[50dvw] md:!max-w-[40dvw] lg:!max-w-none',
                                className,
                            )}
                            {...props}
                        />
                    ),

                    code({ className, children, ...props }) {
                        const getTextContent: any = (node: any) => {
                            if (typeof node === 'string') return node;
                            if (typeof node === 'object' && node !== null) {
                                if (Array.isArray(node)) return node.map(getTextContent).join('');
                                if (node.props?.children) return getTextContent(node.props.children);
                            }
                            return '';
                        };

                        const rawCode = getTextContent(children).trim().replace(/\n$/, '');
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';

                        return (
                            <>
                                {language && rawCode && <CodeHeader language={language} code={rawCode} />}
                                <code
                                    lang={language}
                                    className={cn(
                                        'bg-muted rounded border text-sm p-1',
                                        className,
                                    )}
                                    {...props}
                                >
                                    {children}
                                </code>
                            </>
                        );
                    },

                    h1: ({ className, ...props }) => (
                        <h1
                            className={cn(
                                'mb-3 last:mb-0 scroll-m-20 text-2xl font-extrabold tracking-tight break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    h2: ({ className, ...props }) => (
                        <h2
                            className={cn(
                                'mb-3 last:mb-0 scroll-m-20 text-xl font-semibold tracking-tight break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    h3: ({ className, ...props }) => (
                        <h3
                            className={cn(
                                'mb-2 last:mb-0 scroll-m-20 text-lg font-semibold tracking-tight break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    h4: ({ className, ...props }) => (
                        <h4
                            className={cn(
                                'mb-2 last:mb-0 scroll-m-20 text-base font-semibold tracking-tight break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    h5: ({ className, ...props }) => (
                        <h5
                            className={cn(
                                'mb-2 last:mb-0 text-sm font-semibold break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    h6: ({ className, ...props }) => (
                        <h6
                            className={cn(
                                'mb-2 last:mb-0 text-xs font-semibold break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),

                    p: ({ className, ...props }) => (
                        <p
                            className={cn(
                                'mb-3 last:mb-0 leading-7 wrap-anywhere hyphens-auto',
                                className,
                            )}
                            {...props}
                        />
                    ),

                    a: ({ className, ...props }) => (
                        <a
                            className={cn(
                                'text-link font-medium underline underline-offset-4 break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                            target='_blank'
                        />
                    ),

                    blockquote: ({ className, ...props }) => (
                        <blockquote
                            className={cn(
                                'mb-3 last:mb-0 border-l-4 pl-4 italic break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),

                    ul: ({ className, ...props }) => (
                        <ul
                            className={cn(
                                'mb-3 last:mb-0 ml-5 list-disc [&>li]:mt-1 break-words overflow-visible',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    ol: ({ className, ...props }) => (
                        <ol
                            className={cn(
                                'mb-3 last:mb-0 ml-5 list-decimal [&>li]:mt-1 break-words overflow-visible',
                                className,
                            )}
                            {...props}
                        />
                    ),

                    hr: ({ className, ...props }) => (
                        <hr className={cn('mb-3 last:mb-0 border-b', className)} {...props} />
                    ),

                    /* ── Table ── */
                    table: ({ className, ...props }) => (
                        <div className="relative mb-3 last:mb-0 w-full overflow-x-auto">
                            <table
                                className={cn(
                                    'w-full min-w-[160dvw] sm:min-w-full border-separate border-spacing-0',
                                    className,
                                )}
                                {...props}
                            />
                        </div>
                    ),
                    th: ({ className, ...props }) => (
                        <th
                            className={cn(
                                'bg-muted p-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg',
                                '[&[align=center]]:text-center [&[align=right]]:text-right',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    td: ({ className, ...props }) => (
                        <td
                            className={cn(
                                'border-b border-l p-2 text-left last:border-r',
                                '[&[align=center]]:text-center [&[align=right]]:text-right',
                                className,
                            )}
                            {...props}
                        />
                    ),
                    tr: ({ className, ...props }) => (
                        <tr
                            className={cn(
                                'm-0 border-b p-0 first:border-t',
                                '[&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg',
                                className,
                            )}
                            {...props}
                        />
                    ),

                    sup: ({ className, ...props }) => (
                        <sup
                            className={cn(
                                '[&>a]:text-xs [&>a]:no-underline break-words overflow-hidden',
                                className,
                            )}
                            {...props}
                        />
                    ),

                    img: ({ className, ...props }) => (
                        <span className='block mb-3 last:mb-0 p-2 bg-muted w-fit rounded-md cursor-pointer mx-auto'>
                            <ImageViewer url={props.src as string}>
                                <img
                                    className={cn(
                                        'rounded-md max-w-full max-h-80 object-contain',
                                        className,
                                    )}
                                    {...props}
                                />
                            </ImageViewer>
                        </span>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}