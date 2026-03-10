import { FC, Fragment, useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingCount && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingCount])

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (link.isRestricted) return
    setEditValue(count)
    setIsEditingCount(true)
  }

  const commitCount = () => {
    setIsEditingCount(false)
    const newCount = Math.max(1, editValue)
    if (newCount !== count) {
      onCountChange?.(newCount)
    }
  }

  const cancelEdit = () => {
    setIsEditingCount(false)
    setEditValue(count)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitCount()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const entityTypeSupported = detailsPanelEntityTypes.includes(link.entityType as any)
  const isClickable = entityTypeSupported && !link.isRestricted
  return (
    <Styled.LinkItem
      key={link.linkId}
      onClick={() => isClickable && onEntityClick?.(link.entityId, link.entityType)}
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
            ref={inputRef}
            value={editValue}
            min={1}
            step={1}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(parseInt(e.target.value) || 1)}
            onBlur={commitCount}
            onKeyDown={handleKeyDown}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        ) : (
          <Styled.CountBadge
            onClick={handleBadgeClick}
            data-tooltip="Click to edit count"
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
          data-tooltip={'Remove all links'}
        />
      )}
    </Styled.LinkItem>
  )
}
