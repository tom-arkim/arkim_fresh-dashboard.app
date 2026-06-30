import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserBase from '@/types/user/UserBase';
import userService from '@/services/api/userService';
import { Button } from '@/components/ui/shadcn/button';
import {
  MoreHorizontal,
  Plus,
  RefreshCw,
  Users,
  Search,
  X,
} from 'lucide-react';
import MessengerService from '@/services/ui/messengerService';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
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
import { useUserContext } from '@/components/contexts/AuthContext';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import UserForm from '@/components/settings/users/UserForm';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import CompactLoader from '@/components/ui/CompactLoader';
import { Switch } from '@/components/ui/shadcn/switch';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import useDataStore from '@/store/dataStore';
import { usePermission } from '@/hooks/usePermission';
import { MODULES } from '@/config/constant';
import Pagination, { SizeType } from '@/components/ui/Pagination';
import { useUsersBroadcast } from '@/hooks/broadcasts/use-users-broadcast';
import SetTemporaryPasswordDialog from './SetTempPassword';

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [dialogUser, setDialogUser] = useState<UserBase | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    is_active: false,
  });

  // Temporary password dialog state
  const [tempPasswordDialogOpen, setTempPasswordDialogOpen] = useState(false);
  const [tempPasswordUser, setTempPasswordUser] = useState<UserBase | null>(null);

  const userContextDetails = useUserContext();
  const { fetchUsers } = useDataStore();
  const { hasPermission } = usePermission();

  const { requestUsersRefresh } = useUsersBroadcast((event) => {
    if (event.type === 'USERS_REFRESHED') {
      loadUsers();
    }
  });

  const handleCreate = () => {
    setDialogOpen(true);
    setDialogUser(null);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.list(filters.search, filters.is_active);
      setUsers(data);
    } catch {
      MessengerService.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.is_active]);

  const handleOnSubmit = async () => {
    requestUsersRefresh();
    await loadUsers();
    await fetchUsers(hasPermission(MODULES.USERS.TAG));
    setDialogOpen(false);
    setDialogUser(null);
  };

  const handleOnClose = async () => {
    setDialogOpen(false);
    setDialogUser(null);
  };

  const handleEdit = (user: UserBase) => {
    setDialogUser(user);
    setDialogOpen(true);
  };

  const handleSetTemporaryPassword = useCallback((user: UserBase) => {
    setTempPasswordUser(user);
    setTempPasswordDialogOpen(true);
  }, []);

  const handleUserToggle = useCallback(
    async (user: UserBase) => {
      if (user.email === userContextDetails?.user.email) {
        return;
      }
      const action = user.isActive
        ? t('users.form.deactivate')
        : t('users.form.activate');
      MessengerService.confirm(
        t('users.confirmations.toggleActiveStatus', {
          action: action.toLowerCase(),
        }),
        t('users.confirmations.toggleActiveStatusTitle'),
        async () => {
          try {
            setLoading(true);
            const result = await userService.setActiveStatus(
              user.email,
              !user.isActive
            );
            MessengerService.success(
              !user.isActive
                ? t('users.messages.userActivated')
                : t('users.messages.userDeactivated')
            );
            requestUsersRefresh();
            await loadUsers();
            await fetchUsers(hasPermission(MODULES.USERS.TAG));
          } catch (err) {
            MessengerService.error(t('users.messages.failedToUpdateStatus'));
          } finally {
            setLoading(false);
          }
        }
      );
    },
    [loadUsers, t, userContextDetails?.user.email]
  );

  const deleteUser = async (user: UserBase) => {
    try {
      MessengerService.confirmDelete({
        itemName: 'User',
        itemType: `${user?.firstName} ${user?.lastName}`,
        confirmMessage: t('users.form.deleteDesc'),
        onDelete: async () => {
          await userService.deleteUser(user?.email ?? '');
        },
        onSuccess: async () => {
          await loadUsers();
        },
        undoTimeout: 5000,
      });
    } catch {
      MessengerService.error(t('users.form.deleteUserError'));
    }
  };

  const columns: ColumnDef<UserBase>[] = useMemo(
    () => [
      {
        accessorKey: 'firstName',
        header: t('users.name'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.email === userContextDetails?.user.email && (
              <Badge
                variant="outline"
                style={{ borderColor: '#2563eb', color: '#2563eb' }}
                className="text-xs"
              >
                {t('users.current')}
              </Badge>
            )}
            <span>
              {row.original.firstName} {row.original.lastName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: t('users.email'),
      },
      {
        accessorKey: 'role',
        header: t('users.form.access'),
        cell: ({ row }) => (
          <div className="flex gap-2 flex-wrap">
            {row.original.isAdmin && (
              <Badge
                variant="outline"
                style={{ borderColor: '#16a34a', color: '#16a34a' }}
              >
                {t('users.admin')}
              </Badge>
            )}
            {row.original.isMonitoring && (
              <Badge
                variant="outline"
                style={{ borderColor: '#0891b2', color: '#0891b2' }}
              >
                {t('users.monitoring')}
              </Badge>
            )}
            {row.original.isTechnician && (
              <Badge
                variant="outline"
                style={{ borderColor: '#d97706', color: '#d97706' }}
              >
                {t('users.technician')}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('users.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'destructive'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: t('common.actions'),
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = u.email === userContextDetails?.user.email;
          return isSelf
            ?
            null :
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {/* Set Temporary Password */}
                {
                  userContextDetails?.user.isAdmin && u.isActive &&
                  <>
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetTemporaryPassword(u);
                      }}
                      disabled={isSelf}
                    >
                      {t('users.tempPassword.menuItem')}
                    </DropdownMenuItem>
                  </>
                }

                {/* Activate / Deactivate */}
                <DropdownMenuItem
                  className="flex items-center gap-2 text-sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    handleUserToggle(u);
                  }}
                  disabled={isSelf}
                >
                  {u.isActive ? (
                    <span className="flex items-center gap-2">
                      {t('users.form.deactivate')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('users.form.activate')}
                    </span>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className='text-destructive hover:!bg-destructive/30 hover:!text-destructive'
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUser(u);
                  }}>
                  {t('users.form.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>;
        },
      },
    ],
    [handleUserToggle, handleSetTemporaryPassword, t, userContextDetails?.user.email]
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination
    }
  });

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between sm:items-center sm:flex-row flex-col space-y-2">
        <div>
          <h1 className="page-header">{t('users.title')}</h1>
          <p className="page-subTitle">{t('users.subTitle')}</p>
        </div>
        <div className="flex items-center space-x-2 sm:w-auto w-full">
          <Button onClick={handleCreate} className="sm:flex-none flex-1">
            <Plus className="h-4 w-4 mr-2" /> {t('users.form.createNewUser')}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  requestUsersRefresh();
                  loadUsers();
                }}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.refresh')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
            <CardTitle className="m-0 flex items-center gap-2 shrink-0">
              <Users className="h-6 w-6" />
              {t('users.title')} ({users.length})
            </CardTitle>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:min-w-[400px]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Input
                  className="pl-8 pr-8 w-full"
                  placeholder={t('common.search')}
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, search: '' })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 px-2">
                <Label
                  className="text-sm cursor-pointer"
                  htmlFor="inActiveUser"
                >
                  {t('users.filter.showInactive')}
                </Label>
                <Switch
                  checked={filters.is_active}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, is_active: checked as boolean })
                  }
                  id="inActiveUser"
                />
              </div>
            </div>
          </div>
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
                ) : table.getPaginationRowModel().rows?.length ? (
                  table.getPaginationRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => {
                        handleEdit(row.original);
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
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          {t('users.noUsersAvailable')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t('users.noUsersDescription')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Pagination
              isDataLoading={loading}
              className='mt-5'
              totalPages={table.getPageCount()}
              page={table.getState().pagination.pageIndex + 1}
              size={String(table.getState().pagination.pageSize) as SizeType}
              onPageChange={(page) => {
                table.setPageIndex(page - 1);
              }}
              onSizeChange={(size) => {
                table.setPageSize(Number(size));
                table.setPageIndex(0);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit / Create user form */}
      <UserForm
        onOpenChange={handleOnClose}
        open={dialogOpen}
        onSuccess={handleOnSubmit}
        selectedUser={dialogUser}
      />

      {/* Set temporary password dialog */}
      <SetTemporaryPasswordDialog
        open={tempPasswordDialogOpen}
        user={tempPasswordUser}
        onOpenChange={setTempPasswordDialogOpen}
        onSuccess={() => {
          setTempPasswordDialogOpen(false);
          setTempPasswordUser(null);
        }}
      />
    </div>
  );
};

export default UserManagement;