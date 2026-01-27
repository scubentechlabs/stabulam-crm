import { format } from 'date-fns';
import { User, Mail, Phone, Building2, Clock, IndianRupee, Shield, MoreHorizontal, Pencil, UserX, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import type { UserWithRole } from '@/hooks/useUsers';

interface UserCardProps {
  user: UserWithRole;
  onEdit: (user: UserWithRole) => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
  onChangeRole: (userId: string, role: 'admin' | 'employee') => void;
}

export function UserCard({ user, onEdit, onToggleActive, onChangeRole }: UserCardProps) {
  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isActive = user.is_active !== false;

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{user.full_name}</h3>
                {user.role === 'admin' && (
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                {!isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{user.email}</span>
              </div>
              {user.mobile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{user.mobile}</span>
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {user.department && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{user.department}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <span>₹{(user.monthly_salary || 0).toLocaleString('en-IN')}/mo</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {user.work_start_time?.slice(0, 5) || '09:00'} - {user.work_end_time?.slice(0, 5) || '18:00'}
            </span>
          </div>
          <div className="text-muted-foreground">
            Joined {format(new Date(user.created_at), 'MMM yyyy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
