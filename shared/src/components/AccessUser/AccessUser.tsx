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
  labelChildren?: React.ReactNode // Custom label content
  children?: React.ReactNode // Allow children for controls like dropdown/buttons
  isCompact?: boolean // if true, use compact styling
  isSearchResult?: boolean // if true, indicates this is a search result item
}

export const AccessUser = forwardRef<HTMLDivElement, AccessUserProps>(
  (
    {
      name,
      label,
      icon,
      shareType,
      isMe,
      isOwner,
      isCompact,
      isSearchResult,
      labelChildren,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isUser = shareType === 'user' || shareType === 'guest'
    const showUsername = isUser || isSearchResult
    const userName = isUser ? name : shareType

    return (
      <Styled.User {...props} ref={ref} className={clsx(className, { compact: isCompact })}>
        <ShareOptionIcon shareType={shareType} name={name} label={label} icon={icon} />
        <span className="title-label">
          {label || name}
          {isMe ? (
            <span className={'name'}>(you)</span>
          ) : (
            showUsername && (
              <span className={clsx('name', { 'float-right': isSearchResult })}>({userName})</span>
            )
          )}
          {labelChildren}
        </span>
        {children}
        {isOwner && <span className="owner">Owner</span>}
      </Styled.User>
    )
  },
)
