import { FC, Fragment } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'
import { detailsPanelEntityTypes } from '@shared/api'
import * as Styled from './LinksManager.styled'
import { LinkEntity } from './LinksManager'
import clsx from 'clsx'

export interface LinkManagerItemProps {
  link: LinkEntity
  onEntityClick?: (entityId: string, entityType: string) => void
  onRemove: (e: React.MouseEvent<HTMLButtonElement>, link: LinkEntity) => void
}

export const LinkManagerItem: FC<LinkManagerItemProps> = ({ link, onEntityClick, onRemove }) => {
  const entityTypeSupported = detailsPanelEntityTypes.includes(link.entityType as any)

  return (
    <Styled.LinkItem
      key={link.linkId}
      onClick={() => entityTypeSupported && onEntityClick?.(link.entityId, link.entityType)}
      data-tooltip={link.parents.join('/') + '/' + link.label}
      className={clsx({ clickable: entityTypeSupported })}
    >
      {link.icon ? <Icon icon={link.icon} /> : <Icon icon={getEntityTypeIcon(link.entityType)} />}

      <span className="title">
        {link.parents?.map((part, index) => (
          <Fragment key={index}>
            <span key={index + '-path'}>{part}</span>
            <span key={index + '-separator'}>/</span>
          </Fragment>
        ))}
        <span className="label">{link.label}</span>
      </span>
      <Button icon={'close'} variant="text" className="remove" onClick={(e) => onRemove(e, link)} />
    </Styled.LinkItem>
  )
}
