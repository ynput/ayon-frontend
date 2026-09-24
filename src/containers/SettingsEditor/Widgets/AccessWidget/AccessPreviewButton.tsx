import { FC } from 'react'
import styled from 'styled-components'
import { EVERY_GUESTS_KEY, EVERYONE_GROUP_KEY, ShareOptionIcon } from '@shared/components'
import { ShareOption } from '@shared/api'
import { ACCESS_LEVEL_LABELS } from '@shared/components/AccessUser/AccessUser'
import type { AccessLevel } from '@shared/components/AccessUser/AccessUser'
import { Button, ButtonProps, Icon } from '@ynput/ayon-react-components'
import type { AccessOption } from './AccessEditorDialog'

const StackedButton = styled(Button)`
  padding: 4px 6px;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  text-align: left;
  overflow: hidden;
`

const PreviewChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
  padding: 3px 6px;
  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container-high);

  .label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .access-level-icon {
    flex-shrink: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
`

const LevelIcon = styled(Icon)``

const accessLevelIcons: Record<AccessLevel, string> = {
  0: 'block',
  10: 'visibility',
  20: 'edit',
  30: 'admin_panel_settings',
}

interface AccessPreviewButtonProps extends Partial<Omit<ButtonProps, 'value'>> {
  value: (Partial<ShareOption> & { accessLevel: AccessLevel; iconName?: string })[]
  maxVisible?: number
  accessOptions?: AccessOption[]
  mode?: 'default' | 'compact'
}

export const AccessPreviewButton: FC<AccessPreviewButtonProps> = ({
  value,
  maxVisible = 3,
  accessOptions,
  mode = 'default',
  ...props
}) => {
  // sort by everyone first, then guests, then users/groups/teams alphabetically
  const visibleUsers = value
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
    .slice(0, maxVisible)
  const remainingCount = value.length - maxVisible

  if (value.length === 0) {
    return <Button label="Add access" {...props} />
  }

  return (
    <StackedButton {...props}>
      {visibleUsers
        .filter((u) => !!u.name)
        .map((user) => {
          const levelLabel =
            accessOptions?.find((option) => option.value === user.accessLevel)?.label ||
            ACCESS_LEVEL_LABELS[user.accessLevel]
          return (
            <PreviewChip
              key={user.name}
              data-tooltip={`${user.label || user.name}: ${levelLabel}`}
              data-tooltip-delay={0}
            >
              <ShareOptionIcon
                shareType={user.shareType}
                name={user.iconName || (user.name as string)}
                label={user.label}
                size={20}
                withBackground
                withTooltip={false}
              />
              {mode !== 'compact' && <span className="label">{user.label || user.name}</span>}
              <Icon
                className="access-level-icon"
                icon={accessLevelIcons[user.accessLevel]}
                style={{ fontSize: 18 }}
              />
            </PreviewChip>
          )
        })}
      {remainingCount > 0 && <span>+{remainingCount}</span>}
    </StackedButton>
  )
}
