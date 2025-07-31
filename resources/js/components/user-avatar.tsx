import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type User } from "@/types";
import { cn } from "@/lib/utils";

// Helper function to get initials from a name
const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase().slice(0, 2);
};

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
    user: Partial<User>;
}

export function UserAvatar({ user, className, ...props }: UserAvatarProps) {
    const hasImage = !!user.avatar_url;
    const bgColor = user.avatar_color || '#4f46e5'; // Default color if none is set

    return (
        <Avatar
            className={cn(
                'ring-2 ring-offset-2 ring-offset-background',
                // The ring is transparent if there is no image
                hasImage ? 'ring-primary' : 'ring-transparent',
                className
            )}
            // --- Apply the ring color using an inline style ---
            // We use a CSS variable to easily control the ring color.
            style={{ '--tw-ring-color': bgColor } as React.CSSProperties}
            {...props}
        >
            <AvatarImage src={user.avatar_url || ''} alt={user.name} />
            <AvatarFallback
                // --- Apply the background color to the fallback ---
                style={{ backgroundColor: bgColor }}
            >
                {getInitials(user.name || '')}
            </AvatarFallback>
        </Avatar>
    );
}
