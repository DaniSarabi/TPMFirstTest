import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';
import { UserAvatar } from './user-avatar';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
  const getInitials = useInitials();

  return (
    <>
      <UserAvatar user={user} className="h-8 w-8 text-white" />

      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
      </div>
    </>
  );
}
