import { useMemo, useState } from 'react';
import {
  Bell,
  Check,
  X,
  Clock,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';

const columnHelper = createColumnHelper<any>();

function NotificationPage() {
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: '1',
      type: 'info',
      title: 'System Update Available',
      message:
        'A new version 2.4.0 is available for download. This update includes security patches and performance improvements.',
      time: '5 min ago',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Payment Successful',
      message:
        'Your subscription has been renewed successfully. Next billing date: Oct 30, 2025.',
      time: '1 hour ago',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Storage Almost Full',
      message:
        'You are using 90% of your storage capacity. Consider upgrading your plan or removing unused files.',
      time: '3 hours ago',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '4',
      type: 'error',
      title: 'Failed Login Attempt',
      message:
        'Someone tried to access your account from an unrecognized device in Mumbai, India.',
      time: '1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '5',
      type: 'info',
      title: 'New Message from Support',
      message:
        'Your ticket #12345 has been updated with a response from our support team.',
      time: '2 days ago',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '6',
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated.',
      time: '3 days ago',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '7',
      type: 'warning',
      title: 'Password Expiring Soon',
      message:
        'Your password will expire in 7 days. Please update it to maintain account security.',
      time: '4 days ago',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '8',
      type: 'info',
      title: 'New Feature Released',
      message:
        'Check out our new analytics dashboard with enhanced reporting capabilities.',
      time: '5 days ago',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ]);

  const [rowSelection, setRowSelection] = useState({});
  const [filter, setFilter] = useState<
    'all' | 'unread' | 'info' | 'success' | 'warning' | 'error'
  >('all');

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markSelectedAsRead = () => {
    const selectedIds = Object.keys(rowSelection);
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.includes(n.id) ? { ...n, read: true } : n))
    );
    setRowSelection({});
  };

  const deleteSelected = () => {
    const selectedIds = Object.keys(rowSelection);
    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    setRowSelection({});
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-600 dark:text-green-500" />;
      case 'warning':
        return (
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
        );
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      info: 'bg-primary/10 text-primary',
      success:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      warning:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      error: 'bg-destructive/10 text-destructive',
    };

    return (
      <Badge
        variant="secondary"
        className={`${variants[type as keyof typeof variants]} border-0 text-xs`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getIcon(row.original.type)}
            {getTypeBadge(row.original.type)}
          </div>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Notification',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground">
                {row.original.title}
              </span>
              {!row.original.read && (
                <Badge
                  variant="secondary"
                  className="bg-primary text-primary-foreground border-0 text-xs h-5"
                >
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {row.original.message}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('time', {
        header: 'Time',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{row.original.time}</span>
          </div>
        ),
      }),
      columnHelper.accessor('read', {
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.read ? 'secondary' : 'default'}>
            {row.original.read ? 'Read' : 'Unread'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!row.original.read && (
                <DropdownMenuItem onClick={() => markAsRead(row.original.id)}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => removeNotification(row.original.id)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    []
  );

  const filteredData = useMemo(
    () =>
      notifications.filter((n) => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
      }),
    [filter, notifications]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);
  const selectedCount = useMemo(() => {
    return Object.keys(rowSelection).length;
  }, [rowSelection]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Bell className="w-8 h-8" />
                Notifications
              </h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0 ? (
                  <>
                    You have{' '}
                    <span className="font-semibold text-foreground">
                      {unreadCount}
                    </span>{' '}
                    unread notification{unreadCount !== 1 ? 's' : ''}
                  </>
                ) : (
                  "You're all caught up!"
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select
                value={filter}
                onValueChange={(value: any) => setFilter(value)}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notifications</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-2">
                Showing {filteredData.length} notification
                {filteredData.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markSelectedAsRead}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark as read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelected}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No notifications
            </h3>
            <p className="text-muted-foreground max-w-md">
              {filter === 'all'
                ? "You don't have any notifications at the moment. We'll notify you when something important happens."
                : `No ${filter} notifications found. Try changing the filter.`}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table className="w-full">
              <TableHeader className='bg-card sticky top-0 z-1'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-12 px-4 text-left align-middle font-medium"
                      >
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
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`border-b transition-colors hover:bg-muted/50 ${!row.original.read ? 'bg-accent/30' : ''
                      }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-4 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPage;
