import { FC, Fragment } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'
import { detailsPanelEntityTypes } from '@shared/api'
import * as Styled from './LinksManager.styled'
import { LinkEntity } from './LinksManager'
import clsx from 'clsx'

export interface LinkManagerItemProps {
  link: LinkEntity
  isSelected?: boolean
  onEntityClick?: (entityId: string, entityType: string) => void
  onRemove: (e: React.MouseEvent<HTMLButtonElement>, link: LinkEntity) => void
}

export const LinkManagerItem: FC<LinkManagerItemProps> = ({
  link,
  isSelected = false,
  onEntityClick,
  onRemove,
}) => {
  const entityTypeSupported = detailsPanelEntityTypes.includes(link.entityType as any)
  const isClickable = entityTypeSupported && !link.isRestricted

  return (
    <Styled.LinkItem
      key={link.linkId}
      onClick={() => isClickable && onEntityClick?.(link.entityId, link.entityType)}
      data-tooltip={
        link.isRestricted
          ? ""
          : link.parents.join('/') + '/' + link.label
      }
      className={clsx({
        clickable: isClickable,
        selected: isSelected,
      })}
      style={link.isRestricted ? { opacity: 0.5, fontStyle: 'italic' } : undefined}
    >
      {link.icon ? <Icon icon={link.icon} /> : <Icon icon={getEntityTypeIcon(link.entityType)} />}

      <span className="title">
        {link.isRestricted ? (
          <span className="label">
            You don't have permission to view this link
          </span>
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
      { !link.isRestricted &&
        <Button
          icon={'link_off'}
          variant="text"
          className="remove"
          onClick={(e) => onRemove(e, link)}
          data-tooltip={'Remove link'}
        />
      }

    </Styled.LinkItem>
  )
}
