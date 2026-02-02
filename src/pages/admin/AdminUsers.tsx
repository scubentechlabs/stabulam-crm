import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Plus, Search, Loader2, Shield, UserCheck, UserX } from 'lucide-react';
import { useUsers, type UserWithRole } from '@/hooks/useUsers';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { EditUserForm } from '@/components/users/EditUserForm';
import { UserTable } from '@/components/users/UserTable';
import { FlagForm } from '@/components/flags/FlagForm';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagEmployeeId, setFlagEmployeeId] = useState<string | undefined>(undefined);

  const {
    users,
    activeUsers,
    inactiveUsers,
    adminUsers,
    isLoading,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserActive,
  } = useUsers();

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      user =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const filteredActiveUsers = useMemo(() => {
    if (!searchQuery.trim()) return activeUsers;
    const query = searchQuery.toLowerCase();
    return activeUsers.filter(
      user =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [activeUsers, searchQuery]);

  const filteredInactiveUsers = useMemo(() => {
    if (!searchQuery.trim()) return inactiveUsers;
    const query = searchQuery.toLowerCase();
    return inactiveUsers.filter(
      user =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [inactiveUsers, searchQuery]);

  const handleCreateUser = async (data: Parameters<typeof createUser>[0]) => {
    setIsSubmitting(true);
    const result = await createUser(data);
    setIsSubmitting(false);
    if (!result.error) {
      setShowCreateDialog(false);
    }
    return result;
  };

  const handleUpdateUser = async (data: Parameters<typeof updateUser>[1]) => {
    if (!editingUser) return { error: new Error('No user selected') };
    setIsSubmitting(true);
    const result = await updateUser(editingUser.user_id, data);
    setIsSubmitting(false);
    return result;
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    await toggleUserActive(userId, isActive);
  };

  const handleChangeRole = async (userId: string, role: 'admin' | 'employee') => {
    await updateUserRole(userId, role);
  };

  const handleIssueFlag = (userId: string) => {
    setFlagEmployeeId(userId);
    setShowFlagForm(true);
  };

  const handleViewFlags = (userId: string) => {
    navigate(`/admin/flags?employee=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">User Management</h1>
          <p className="page-description">Manage all employees in the system</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeUsers.length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-destructive/10">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveUsers.length}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-amber-500/10">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminUsers.length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Employees</CardTitle>
              <CardDescription>Manage employee accounts and settings</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({users.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeUsers.length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({inactiveUsers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <UserTable 
                users={filteredUsers}
                onEdit={setEditingUser}
                onToggleActive={handleToggleActive}
                onChangeRole={handleChangeRole}
                onIssueFlag={handleIssueFlag}
                emptyMessage={searchQuery ? 'No matching employees found' : 'No employees added yet'}
              />
            </TabsContent>

            <TabsContent value="active">
              <UserTable 
                users={filteredActiveUsers}
                onEdit={setEditingUser}
                onToggleActive={handleToggleActive}
                onChangeRole={handleChangeRole}
                onIssueFlag={handleIssueFlag}
                emptyMessage="No active employees"
              />
            </TabsContent>

            <TabsContent value="inactive">
              <UserTable 
                users={filteredInactiveUsers}
                onEdit={setEditingUser}
                onToggleActive={handleToggleActive}
                onChangeRole={handleChangeRole}
                onIssueFlag={handleIssueFlag}
                emptyMessage="No inactive employees"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee account with login credentials
            </DialogDescription>
          </DialogHeader>
          <CreateUserForm
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee details and settings
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <EditUserForm
              user={editingUser}
              onSubmit={handleUpdateUser}
              onCancel={() => setEditingUser(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Issue Flag Dialog */}
      <FlagForm
        open={showFlagForm}
        onOpenChange={(open) => {
          setShowFlagForm(open);
          if (!open) setFlagEmployeeId(undefined);
        }}
        preselectedEmployeeId={flagEmployeeId}
      />
    </div>
  );
}
