import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './shadcn/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './shadcn/select';

export type SizeType = '10' | '20' | '50' | '100';

interface PaginationProps {
    totalPages: number;
    page: number;
    size: SizeType;
    onPageChange: (page: number) => void;
    onSizeChange: (size: SizeType) => void;
    isDataLoading?: boolean;
    className?: string;
}

export default function Pagination({
    totalPages,
    page,
    size,
    onPageChange,
    onSizeChange,
    isDataLoading,
    className
}: PaginationProps) {

    function changePage(p: number) {
        if (p < 1 || p > totalPages) return;
        onPageChange(p);
    };

    function getButtons() {
        const pages: (number | string)[] = [];

        if (totalPages <= 1) return [1];

        const windowSize = 1; // pages on each side of current
        const startPage = Math.max(2, page - windowSize);
        const endPage = Math.min(totalPages - 1, page + windowSize);

        pages.push(1);

        if (startPage > 2) {
            pages.push("...");
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < totalPages - 1) {
            pages.push("...");
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };


    return <div className={cn(
        'w-full flex flex-wrap justify-center sm:justify-end gap-3 px-1',
        className
    )}>
        <div className="flex flex-row items-center gap-2">
            {
                isDataLoading ?
                    <Skeleton className='h-8 w-18' />
                    :
                    <>
                        <p className="text-sm">Show</p>
                        <Select
                            value={size}
                            onValueChange={(value) => {
                                onSizeChange(value as SizeType);
                            }}
                        >
                            <SelectTrigger className="py-0 px-1.5 !bg-transparent">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>

                    </>
            }
        </div>

        <div className="flex items-center justify-between gap-0.5 sm:gap-2">
            {
                isDataLoading
                    ?
                    <>
                        <Skeleton className='size-8' />
                        <Skeleton className='size-8' />
                        <Skeleton className='size-8' />
                    </>
                    :
                    <>
                        <button
                            className='py-2 px-1.5 rounded-md text-sm hover:bg-sidebar-accent disabled:pointer-events-none disabled:opacity-50'
                            disabled={page === 1}
                            onClick={() => changePage(page - 1)}
                        >
                            <ChevronLeft className='size-4' />
                        </button>

                        {getButtons().map((item, index) =>
                            item === '...' ? (
                                <span
                                    key={`dots-${index}`}
                                    className="px-2 select-none"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={`page-${item}`}
                                    className={cn(
                                        'py-1.5 px-2.5 rounded-md text-sm',
                                        item === page
                                            ? 'bg-sidebar-accent'
                                            : 'bg-transparent hover:bg-sidebar-accent'
                                    )}
                                    onClick={() => changePage(Number(item))}
                                >
                                    {item}
                                </button>
                            )
                        )}

                        <button
                            className='py-2 px-1.5 rounded-md text-sm hover:bg-sidebar-accent disabled:pointer-events-none disabled:opacity-50'
                            disabled={page === totalPages}
                            onClick={() => changePage(page + 1)}
                        >
                            <ChevronRight className='size-4' />
                        </button>
                    </>
            }
        </div>
    </div>;
}
