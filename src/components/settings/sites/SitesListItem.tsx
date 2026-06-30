import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import CompactLoader from '@/components/ui/CompactLoader';
import SiteBase from '@/types/sites/SiteBase';

interface SiteListCardProps {
  sites: SiteBase[];
  loading: boolean;
  onEdit: (site: SiteBase) => void;
}

export function SiteListCard({
  sites,
  loading,
  onEdit,
}: SiteListCardProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<SiteBase>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: () => t('sites.name'),
        cell: ({ row }) => (
          <div className="font-semibold">{row.getValue('name')}</div>
        ),
      },
      {
        accessorKey: 'description',
        header: t('sites.description'),
        cell: ({ row }) => (
          <div className="max-w-[400px] truncate">
            {row.getValue('description') || (
              <span className="text-muted-foreground italic">
                {t('sites.noDescription')}
              </span>
            )}
          </div>
        ),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: sites,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          {t('sites.title')} ({sites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Table>
            <TableHeader className='bg-card sticky top-0 z-1'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="flex justify-center items-center ">
                      <CompactLoader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => {
                      onEdit(row.original);
                    }}
                    className="cursor-pointer h-12"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        {t('sites.noLocationsAvailable')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('sites.noLocationsDescription')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
