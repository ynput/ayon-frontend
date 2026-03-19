import { FC, Fragment, useState } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { detailsPanelEntityTypes } from '@shared/api'
import * as Styled from './LinksManager.styled'
import { LinkEntity } from './LinksManager'
import clsx from 'clsx'
import { EntityIcon } from '@shared/components/EntityIcon'

export interface LinkManagerItemProps {
  link: LinkEntity
  count: number
  isSelected?: boolean
  onEntityClick?: (entityId: string, entityType: string) => void
  onRemove: (e: React.MouseEvent<HTMLButtonElement>, link: LinkEntity) => void
  onCountChange?: (newCount: number) => void
  isManager?: boolean
}

export const LinkManagerItem: FC<LinkManagerItemProps> = ({
  link,
  count,
  isSelected = false,
  onEntityClick,
  onRemove,
  onCountChange,
  isManager = false,
}) => {
  const [isEditingCount, setIsEditingCount] = useState(false)
  const [editValue, setEditValue] = useState(count)

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (link.isRestricted) return
    setEditValue(count)
    setIsEditingCount(true)
  }

  const commitCount = () => {
    const newCount = Math.max(1, editValue)
    if (newCount !== count) {
      onCountChange?.(newCount)
    }
    setIsEditingCount(false)
  }

  const cancelEdit = () => {
    setEditValue(count)
    setIsEditingCount(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const entityTypeSupported = detailsPanelEntityTypes.includes(link.entityType as any)
  const isClickable = entityTypeSupported && !link.isRestricted
  return (
    <Styled.LinkItem
      onClick={() => !isEditingCount && isClickable && onEntityClick?.(link.entityId, link.entityType)}
      data-tooltip={
        link.isRestricted
          ? isManager
            ? 'Unknown Link - Entity not found'
            : 'Access Restricted - Insufficient Permissions to Entity'
          : link.parents.join('/') + '/' + link.label
      }
      className={clsx({
        clickable: isClickable,
        selected: isSelected,
        restricted: link.isRestricted && !isManager,
        unknown: link.isRestricted && isManager,
      })}
    >
      <EntityIcon entity={{entityType: link.entityType}} icon={link?.icon} color={link.color} />
      <span className="title">
        {link.isRestricted ? (
          <span className="label">{isManager ? 'Unknown' : 'Access Restricted'}</span>
        ) : (
          <>
            {link.parents?.map((part, index) => (
              <Fragment key={index}>
                <span key={index + '-path'}>{part}</span>
                <span key={index + '-separator'}>/</span>
              </Fragment>
            ))}
            <span className="label">{link.label}</span>
          </>
        )}
      </span>
      {!link.isRestricted && (
        isEditingCount ? (
          <Styled.CountInput
            value={editValue}
            min={1}
            autoFocus
            onChange={(e) => setEditValue(parseInt(e.target.value) || 1)}
            onFocus={(e) => e.target.select()}
            onBlur={commitCount}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            data-tooltip="Number of links to this entity."
          />
        ) : (
          <Styled.CountBadge
            onClick={handleBadgeClick}
            tabIndex={0}
            data-tooltip="Number of links to this entity."
          >
            x{count}
          </Styled.CountBadge>
        )
      )}
      {(!link.isRestricted || isManager) && (
        <Button
          icon={'link_off'}
          variant="text"
          className="remove"
          onClick={(e) => onRemove(e, link)}
          data-tooltip={count > 1 ? `Remove all ${count} links` : 'Remove link'}
        />
      )}
    </Styled.LinkItem>
  )
}
