import { useEffect, useMemo, useState } from "react";
import MessengerService from '@/services/ui/messengerService';
import onboardingService from '@/services/api/onboardingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/shadcn/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Skeleton } from '../ui/shadcn/skeleton';
import AssetDetails, { AssetDocument,  AssetDocumentList } from '@/types/equipment/AssetDetails';
import { EyeIcon, FileStack, Loader2 } from "lucide-react";

export default function DocumentTable({ bgColor = 'bg-card', equipment, setPreviewData, emptyState }: { bgColor?: 'bg-card' | 'bg-transparent'; equipment: Partial<AssetDetails> | null; setPreviewData: (data: { url: string; name: string; }) => void; emptyState: React.ReactNode }) {
    // document list
    const [documentList, setDocumentList] = useState<AssetDocumentList>([]);
    // is data loading flag
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

    const getDocuments = async () => {
        try {
            if (equipment?.id) {
                setIsDataLoading(true);
                const response = await onboardingService.getDocumentsByAssetAndModelId(
                    equipment.id,
                    equipment.assetModelId ?? ''
                );
                setDocumentList(response);
            }
        } catch (error: any) {
            MessengerService.error(error.message, 'Error');
        } finally {
            setIsDataLoading(false);
        }
    }

    useEffect(() => {
        if (equipment) {
            getDocuments();
        }
    }, [equipment]);

    const columns: ColumnDef<AssetDocument>[] = useMemo(() => {
        const preColumns: ColumnDef<AssetDocument>[] = [
            {
                accessorKey: 'fileName',
                header: ({ column }) => <div className="flex justify-start">
                    Name
                </div>,
                cell: ({ row }) => <div className="text-start font-medium">{row.getValue('fileName')}</div>,
            },
            {
                accessorKey: 'documentCategory',
                header: ({ column }) => <div className="flex justify-center">
                    Type
                </div>,
                cell: ({ row }) => <div className="text-center">{row.getValue('documentCategory')}</div>,
            },
            {
                accessorKey: 'source',
                header: ({ column }) => <div className="flex justify-center">
                    Source
                </div>,
                cell: ({ row }) => {
                    const doc = row.original;

                    return <div className="text-center">
                        {doc.source.charAt(0).toUpperCase() + doc.source.slice(1)}
                    </div>
                }
            },
            {
                accessorKey: 'action',
                header: () => <div className="text-center">Action</div>,
                cell: ({ row }) => {
                    const doc = row.original;

                    return <div className="flex flex-row justify-center items-center gap-2">
                        <button type="button" className="text-xs font-medium border border-foreground rounded-md px-2 py-1.5 flex flex-row items-center gap-1 hover:bg-muted hover:border-transparent" onClick={() => setPreviewData({ url: doc.previewUrl, name: doc.fileName })}>
                            <EyeIcon className="w-4 h-4" /> Preview
                        </button>

                        {/* <a href={doc.sourceUrl ?? doc.previewUrl} target='_blank'>
                            <button type="button" className="text-xs font-medium border border-foreground rounded-md px-2 py-1.5 flex flex-row items-center gap-1 hover:bg-muted hover:border-transparent">
                                <FileIcon className="w-4 h-4" /> Full Document
                            </button>
                        </a> */}
                    </div>
                }
            }
        ];

        return preColumns;
    }, [documentList]);

    const table = useReactTable({
        data: documentList,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    return isDataLoading ?
        <Skeleton className='w-full h-50 mt-2' />
        :
        documentList && documentList.length > 0 ?
            <Table>
                <TableHeader className={`${bgColor} sticky top-0 z-1`}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    className="font-medium"
                                    key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isDataLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                <div className="flex flex-col gap-1 justify-center items-center py-12">
                                    <Loader2 className="animate-spin size-6" />
                                    <p>Loading...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="py-3">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24">
                                <div className="text-center py-12">
                                    <FileStack
                                        className="text-muted-foreground w-15 h-15 mx-auto mb-4"
                                        strokeWidth={1}
                                    />
                                    <h3 className="text-base font-medium mb-1">
                                        No Document Found
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Asset related documents will appear here
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            : (
                emptyState
            )
}