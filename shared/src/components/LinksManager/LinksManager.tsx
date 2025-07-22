import { FC, useState } from 'react'
import * as Styled from './LinksManager.styled'
import { Button, Icon } from '@ynput/ayon-react-components'
import { getEntityId, getEntityTypeIcon } from '@shared/util'
import useUpdateLinks from './hooks/useUpdateLinks'
import AddNewLinks, { LinkSearchType } from './AddNewLinks'
import { EntityPickerDialog, PickerEntityType } from '@shared/containers/EntityPickerDialog'
import { formatEntityPath } from './utils/formatEntityPath'

export type LinkEntity = {
  linkId: string
  entityId: string
  label: string
  path: string
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
  onEntityClick?: (entityId: string, entityType: string) => void // a click on an linked entity
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
  onEntityClick,
}) => {
  const linksUpdater = useUpdateLinks({
    projectName,
    direction,
    entityId,
    entityType,
    targetEntityType,
    linkType,
  })

  const [searchType, setSearchType] = useState<LinkSearchType>(null)

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>, link: LinkEntity) => {
    // prevent clicks higher up
    e.stopPropagation()

    linksUpdater.remove([
      {
        id: link.linkId,
        target: { entityId: link.entityId, entityType: link.entityType },
      },
    ])
  }

  return (
    <>
      <Styled.Container>
        <Styled.Header>
          {linkTypeLabel} links ({direction})
        </Styled.Header>
        <Styled.LinksList>
          {links?.map((link) => (
            <Styled.LinkItem
              key={link.linkId}
              onClick={() => onEntityClick?.(link.entityId, link.entityType)}
              data-tooltip={link.path + '/' + link.label}
            >
              {link.icon ? (
                <Icon icon={link.icon} />
              ) : (
                <Icon icon={getEntityTypeIcon(link.entityType)} />
              )}

              <span className="title">
                {formatEntityPath(link.path, link.entityType).map((p, i) => (
                  <span key={i} className="path">
                    {p}
                  </span>
                ))}
                <span className="label">{link.label}</span>
              </span>
              <Button
                icon={'close'}
                variant="text"
                className="remove"
                onClick={(e) => handleRemove(e, link)}
              />
            </Styled.LinkItem>
          ))}
        </Styled.LinksList>
        <AddNewLinks
          targetEntityType={targetEntityType}
          projectName={projectName}
          onClose={onClose}
          onAdd={(id) => linksUpdater.add([{ targetEntityId: id, linkId: getEntityId() }])}
          searchType={searchType}
          onSearchTypeChange={setSearchType}
        />
      </Styled.Container>
      {searchType === 'picker' && (
        <EntityPickerDialog
          onClose={() => setSearchType(null)}
          projectName={projectName}
          entityType={targetEntityType as PickerEntityType}
          onSubmit={(s) =>
            linksUpdater.add(s.map((id) => ({ targetEntityId: id, linkId: getEntityId() })))
          }
          isMultiSelect
        />
      )}
    </>
  )
}
