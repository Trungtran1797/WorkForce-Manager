import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ProjectMember } from '@/features/projects/types'

const AVATAR_COLOR_MAP: Record<ProjectMember['avatarColor'], string> = {
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  gray: 'bg-muted text-muted-foreground',
}

const MAX_VISIBLE_MEMBERS = 3

export function MemberAvatarStack({ members }: { members: ProjectMember[] }) {
  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS)
  const remainingCount = members.length - visibleMembers.length

  return (
    <div className="flex -space-x-2">
      {visibleMembers.map((member) => (
        <Avatar key={member.id} className="border-2 border-card" title={member.name}>
          <AvatarFallback className={cn(AVATAR_COLOR_MAP[member.avatarColor])}>
            {member.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <Avatar className="border-2 border-card">
          <AvatarFallback className="bg-muted text-muted-foreground">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
