import { forwardRef } from 'react'
import * as Styled from './AccessUser.styled'
import { ShareOptionIcon } from '../ShareOptionIcon'
import clsx from 'clsx'

export const ACCESS_LEVEL_LABELS = {
  0: 'No access',
  10: 'Viewer',
  20: 'Editor',
  30: 'Admin',
}

export type AccessLevel = 0 | 10 | 20 | 30

export interface AccessUser {
  value: string // unique identifier for the user or group
  name: string
  label?: string
  shareType?: string
  icon?: string // optional icon for the user
  accessLevel?: AccessLevel // access level (optional for display-only usage)
  isOwner?: boolean // if this user is the owner
  isMe?: boolean // if this user is the current user
}

export interface AccessUserProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<AccessUser, 'icon' | 'name' | 'label' | 'shareType' | 'isMe' | 'isOwner'> {
  children?: React.ReactNode // Allow children for controls like dropdown/buttons
  isCompact?: boolean // if true, use compact styling
}

export const AccessUser = forwardRef<HTMLDivElement, AccessUserProps>(
  (
    { name, label, icon, shareType, isMe, isOwner, isCompact, children, className, ...props },
    ref,
  ) => {
    const showUsername = label && label !== name && !name.startsWith('__') && !name.endsWith('__')

    return (
      <Styled.User {...props} ref={ref} className={clsx(className, { compact: isCompact })}>
        <ShareOptionIcon shareType={shareType} name={name} label={label} icon={icon} />
        <span className="label">
          {label || name}
          {isMe ? (
            <span className="name">(you)</span>
          ) : (
            showUsername && <span className="name">({name})</span>
          )}
        </span>
        {isOwner && <span className="owner">Owner</span>}
        {children}
      </Styled.User>
    )
  },
)
