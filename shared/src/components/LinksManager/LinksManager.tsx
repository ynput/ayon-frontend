import { FC, useState } from 'react'
import * as Styled from './LinksManager.styled'
import { getEntityId } from '@shared/util'
import useUpdateLinks from './hooks/useUpdateLinks'
import AddNewLinks, { LinkSearchType } from './AddNewLinks'
import { EntityPickerDialog, PickerEntityType } from '@shared/containers/EntityPickerDialog'
import { upperFirst } from 'lodash'
import { LinkManagerItem } from './LinkManagerItem'
import { Button } from '@ynput/ayon-react-components'
import { useGlobalContext } from '@shared/context'
import { groupLinksByEntity, GroupedLink } from './utils/groupLinks'

export type LinkEntity = {
  linkId: string
  entityId: string
  label: string
  parents: string[]
  entityType: string
  icon: string
  color?: string // color from folder/task type anatomy
  isRestricted?: boolean // flag to indicate if this link is restricted (node is null from API)
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
  const { user } = useGlobalContext()
  const isManager = user?.data?.isAdmin || user?.data?.isManager

  const linksUpdater = useUpdateLinks({
    projectName,
    direction,
    entityId,
    entityType,
    targetEntityType,
    linkType,
  })

  const [searchType, setSearchType] = useState<LinkSearchType>(null)
  // Optimistic counts for immediate UI feedback (creates are not optimistic in the cache)
  const [optimisticCounts, setOptimisticCounts] = useState<Record<string, number>>({})

  const groupedLinks = groupLinksByEntity(links)

  // Get display count: use optimistic value until real data catches up
  const getDisplayCount = (group: GroupedLink) => {
    const optimistic = optimisticCounts[group.groupKey]
    if (optimistic !== undefined && optimistic !== group.count) {
      return optimistic
    }
    return group.count
  }

  const handleRemoveGroup = (e: React.MouseEvent<HTMLButtonElement>, group: GroupedLink) => {
    e.stopPropagation()

    linksUpdater.remove(
      group.linkIds.map((id) => ({
        id,
        target: { entityId: group.entityId, entityType: group.representative.entityType },
      })),
    )
  }

  const handleCountChange = (group: GroupedLink, newCount: number) => {
    const currentCount = getDisplayCount(group)
    // Set optimistic count immediately for instant UI feedback
    setOptimisticCounts((prev) => ({ ...prev, [group.groupKey]: newCount }))

    const diff = newCount - currentCount
    if (diff > 0) {
      // Add more links
      const newLinks = Array.from({ length: diff }, () => ({
        targetEntityId: group.entityId,
        linkId: getEntityId(),
      }))
      linksUpdater.add(newLinks)
    } else if (diff < 0) {
      // Remove links from the end (diff is negative, so slice(-3) takes last 3)
      const linksToRemove = group.linkIds.slice(diff).map((id) => ({
        id,
        target: { entityId: group.entityId, entityType: group.representative.entityType },
      }))
      linksUpdater.remove(linksToRemove)
    }
  }

  return (
    <>
      <Styled.Container
        onMouseDown={(e) => {
          // Blur active input when clicking anywhere in the dialog (so count input commits)
          if (e.target !== document.activeElement && document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur()
          }
        }}
      >
        <Styled.Header>
          {upperFirst(linkTypeLabel)} links ({direction})
          <Button
            icon={'close'}
            variant="text"
            className="remove"
            onClick={onClose}
            data-shortcut={'Escape'}
            data-tooltip-delay={500}
          />
        </Styled.Header>
        <Styled.LinksList>
          {groupedLinks.map((group) => (
            <LinkManagerItem
              key={group.representative.linkId}
              link={group.representative}
              count={getDisplayCount(group)}
              isSelected={selectedEntityIds.includes(group.entityId)}
              onEntityClick={onEntityClick}
              onRemove={(e) => handleRemoveGroup(e, group)}
              onCountChange={(newCount) => handleCountChange(group, newCount)}
              isManager={isManager}
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
