import { FC, useState } from 'react'
import * as Styled from './LinksManager.styled'
import { getEntityId } from '@shared/util'
import useUpdateLinks from './hooks/useUpdateLinks'
import AddNewLinks, { LinkSearchType } from './AddNewLinks'
import { EntityPickerDialog, PickerEntityType } from '@shared/containers/EntityPickerDialog'
import { upperFirst } from 'lodash'
import { LinkManagerItem } from './LinkManagerItem'

export type LinkEntity = {
  linkId: string
  entityId: string
  label: string
  parents: string[]
  entityType: string
  icon: string
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
  folderId?: string | null // the folder selected or the parent folder of the selected (used in EntityPickerDialog)
  selectedEntityIds?: string[] // list of selected entity IDs to highlight
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
  folderId,
  selectedEntityIds = [],
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
          {upperFirst(linkTypeLabel)} links ({direction})
        </Styled.Header>
        <Styled.LinksList>
          {links?.map((link) => (
            <LinkManagerItem
              key={link.linkId}
              link={link}
              isSelected={selectedEntityIds.includes(link.entityId)}
              onEntityClick={onEntityClick}
              onRemove={handleRemove}
            />
          ))}
          {links.length === 0 && <Styled.SubHeader>No links yet</Styled.SubHeader>}
        </Styled.LinksList>
        <AddNewLinks
          targetEntityType={targetEntityType}
          projectName={projectName}
          onClose={onClose}
          onAdd={(id) => linksUpdater.add([{ targetEntityId: id, linkId: getEntityId() }])}
          onSearchTypeChange={setSearchType}
        />
      </Styled.Container>
      {searchType === 'picker' && (
        <EntityPickerDialog
          onClose={() => setSearchType(null)}
          projectName={projectName}
          entityType={targetEntityType as PickerEntityType} // the type of entity to pick
          initialSelection={folderId ? { folder: { [folderId]: true } } : undefined} // preselect current folder
          onSubmit={(s) =>
            linksUpdater.add(s.map((id) => ({ targetEntityId: id, linkId: getEntityId() })))
          }
          isMultiSelect
        />
      )}
    </>
  )
}
