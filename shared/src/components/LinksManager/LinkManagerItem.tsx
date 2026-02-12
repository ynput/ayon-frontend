import { FC, Fragment } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { detailsPanelEntityTypes } from '@shared/api'
import * as Styled from './LinksManager.styled'
import { LinkEntity } from './LinksManager'
import clsx from 'clsx'
import { EntityIcon } from '@shared/components/EntityIcon'

export interface LinkManagerItemProps {
  link: LinkEntity
  isSelected?: boolean
  onEntityClick?: (entityId: string, entityType: string) => void
  onRemove: (e: React.MouseEvent<HTMLButtonElement>, link: LinkEntity) => void
  isManager?: boolean
}

export const LinkManagerItem: FC<LinkManagerItemProps> = ({
  link,
  isSelected = false,
  onEntityClick,
  onRemove,
  isManager = false,
}) => {
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
      {(!link.isRestricted || isManager) && (
        <Button
          icon={'link_off'}
          variant="text"
          className="remove"
          onClick={(e) => onRemove(e, link)}
          data-tooltip={'Remove link'}
        />
      )}
    </Styled.LinkItem>
  )
}
