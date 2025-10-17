import { FC } from 'react'
import styled from 'styled-components'
import { EVERY_GUESTS_KEY, EVERYONE_GROUP_KEY, ShareOptionIcon } from '@shared/components'
import { ShareOption } from '@shared/api'
import { Button, ButtonProps } from '@ynput/ayon-react-components'

const StackedButton = styled(Button)`
  padding: 4px 6px;
  justify-content: flex-start;
  gap: 2px;
`

interface AccessPreviewButtonProps extends Partial<Omit<ButtonProps, 'value'>> {
  value: Partial<ShareOption>[]
  maxVisible?: number
}

export const AccessPreviewButton: FC<AccessPreviewButtonProps> = ({
  value,
  maxVisible = 3,
  ...props
}) => {
  // sort by everyone first, then guests, then users/groups/teams alphabetically
  const visibleUsers = value
    .slice(0, maxVisible)
    .toSorted((a, b) =>
      a.name?.startsWith(EVERYONE_GROUP_KEY)
        ? -1
        : b.name?.startsWith(EVERYONE_GROUP_KEY)
        ? 1
        : a.name?.startsWith(EVERY_GUESTS_KEY)
        ? -1
        : b.name?.startsWith(EVERY_GUESTS_KEY)
        ? 1
        : (a.label || a.name || '').localeCompare(b.label || b.name || ''),
    )
  const remainingCount = value.length - maxVisible

  if (value.length === 0) {
    return <Button label="Add access" {...props} />
  }

  return (
    <StackedButton {...props}>
      {visibleUsers
        .filter((u) => !!u.name)
        .map((user) => (
          <ShareOptionIcon
            shareType={user.shareType}
            name={user.name as string}
            label={user.label}
            size={24}
            key={user.name}
            withBackground
          />
        ))}
      {remainingCount > 0 && <span>+{remainingCount}</span>}
    </StackedButton>
  )
}
