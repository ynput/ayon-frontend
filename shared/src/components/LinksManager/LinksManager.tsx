import { FC } from 'react'
import * as Styled from './LinksManager.styled'
import { Button, Icon } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'
import useUpdateLinks from './hooks/useUpdateLinks'

export type LinkEntity = {
  linkId: string
  entityId: string
  label: string
  entityType: string
  icon?: string
}

export interface LinksManagerProps {
  linkTypeLabel: string
  direction?: 'in' | 'out'
  links: LinkEntity[] // used to display basic info about the links entity
  projectName: string
  entityId: string // the entity id of the entity that has these links
}

export const LinksManager: FC<LinksManagerProps> = ({
  linkTypeLabel,
  direction,
  links,
  projectName,
  entityId,
}) => {
  const linksUpdater = useUpdateLinks({ projectName, entityId })

  return (
    <Styled.Container>
      <Styled.Header>
        {linkTypeLabel} links ({direction})
      </Styled.Header>
      <Styled.LinksList>
        {links.map((link) => (
          <Styled.LinkItem key={link.linkId}>
            {link.icon ? (
              <Icon icon={link.icon} />
            ) : (
              <Icon icon={getEntityTypeIcon(link.entityType)} />
            )}
            <span className="label">{link.label}</span>
            <Button
              icon={'close'}
              variant="text"
              className="remove"
              onClick={() => linksUpdater.remove([link.linkId])}
            />
          </Styled.LinkItem>
        ))}
      </Styled.LinksList>
    </Styled.Container>
  )
}
