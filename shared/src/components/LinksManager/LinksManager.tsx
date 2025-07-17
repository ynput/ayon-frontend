import { FC, useEffect } from 'react'
import * as Styled from './LinksManager.styled'
import { Button, Icon } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'
import useUpdateLinks from './hooks/useUpdateLinks'
import AddNewLinks from './AddNewLinks'

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
  linkType: string // full link type e.g. workflow|task|task
  entityType: string // the entity type of the entity that has these links
  targetEntityType: string // the entity type of the out links
  onClose?: () => void
}

export const LinksManager: FC<LinksManagerProps> = ({
  linkTypeLabel,
  direction,
  links = [],
  projectName,
  entityId,
  entityType,
  linkType,
  targetEntityType,
  onClose,
}) => {
  const linksUpdater = useUpdateLinks({
    projectName,
    direction,
    entityId,
    entityType,
    targetEntityType,
    linkType,
  })

  return (
    <Styled.Container>
      <Styled.Header>
        {linkTypeLabel} links ({direction})
      </Styled.Header>
      <Styled.LinksList>
        {links?.map((link) => (
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
              onClick={() =>
                linksUpdater.remove([
                  {
                    id: link.linkId,
                    target: { entityId: link.entityId, entityType: link.entityType },
                  },
                ])
              }
            />
          </Styled.LinkItem>
        ))}
      </Styled.LinksList>
      <AddNewLinks
        targetEntityType={targetEntityType}
        projectName={projectName}
        onClose={onClose}
        onAdd={(id) => linksUpdater.add(id)}
      />
    </Styled.Container>
  )
}
