import { MoreHorizontal, Pencil, Shield, User, UserCheck, UserX, Users, Mail, Phone } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableFilters, SortableHeader } from '@/components/ui/table-filters';
import { useTableFilters } from '@/hooks/useTableFilters';
import type { UserWithRole } from '@/hooks/useUsers';

interface UserTableProps {
  users: UserWithRole[];
  onEdit: (user: UserWithRole) => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
  onChangeRole: (userId: string, role: 'admin' | 'employee') => void;
  emptyMessage?: string;
  showFilters?: boolean;
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export function UserTable({ 
  users, 
  onEdit, 
  onToggleActive, 
  onChangeRole, 
  emptyMessage = 'No users found',
  showFilters = true,
}: UserTableProps) {
  const {
    searchValue,
    setSearchValue,
    statusFilter,
    setStatusFilter,
    sortConfig,
    handleSort,
    filteredData,
  } = useTableFilters({
    data: users,
    searchKeys: ['full_name', 'email', 'department', 'mobile'] as (keyof UserWithRole)[],
    defaultSortKey: 'full_name',
    defaultSortDirection: 'asc',
  });

  // Apply custom status filter for users
  const displayData = statusFilter === 'all' 
    ? filteredData 
    : filteredData.filter(user => 
        statusFilter === 'active' ? user.is_active !== false : user.is_active === false
      );

  return (
    <>
      {showFilters && (
        <TableFilters
          searchPlaceholder="Search by name, email, department..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusOptions={STATUS_OPTIONS}
          resultCount={displayData.length}
        />
      )}

      {displayData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{searchValue || statusFilter !== 'all' ? 'No matching results' : emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader
                    label="Employee"
                    sortKey="full_name"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Contact"
                    sortKey="email"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Department"
                    sortKey="department"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">
                  <SortableHeader
                    label="Salary"
                    sortKey="monthly_salary"
                    currentSortKey={sortConfig.key as string}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                    className="justify-end"
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((user) => {
                const initials = user.full_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const isActive = user.is_active !== false;

                return (
                  <TableRow key={user.id} className={!isActive ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                        {user.mobile && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{user.mobile}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.department || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.role === 'admin' ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">Employee</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isActive ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.monthly_salary ? (
                        <span className="font-medium">₹{user.monthly_salary.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.role === 'employee' ? (
                            <DropdownMenuItem onClick={() => onChangeRole(user.user_id, 'admin')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onChangeRole(user.user_id, 'employee')}>
                              <User className="h-4 w-4 mr-2" />
                              Remove Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {isActive ? (
                            <DropdownMenuItem 
                              onClick={() => onToggleActive(user.user_id, false)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onToggleActive(user.user_id, true)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
