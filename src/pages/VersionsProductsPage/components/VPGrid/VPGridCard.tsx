import { EntityCard } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { InView } from 'react-intersection-observer'
import { ProjectModel } from '@shared/api'

interface VPGridCardProps {
  entity: {
    id: string
    entityType: string
    header: string
    path: string
    title: string
    icon: string
    status: string
    author?: string | null
    isPlayable: boolean
    thumbnailUrl: string | undefined
    versions?: string[]
  }
  index: number
  projectInfo: ProjectModel | undefined
  root?: HTMLDivElement | null
  isEntitySelected: (entityId: string, entityType: string) => boolean
  handleCardClick: (e: React.MouseEvent, entityId: string, index: number, columnId: string) => void
  handleDoubleClick: (e: React.MouseEvent, entityId: string) => void
  gridColumnId: string
  rowSelectionColumnId: string
}

export const VPGridCard: FC<VPGridCardProps> = ({
  entity,
  index,
  projectInfo,
  root,
  isEntitySelected,
  handleCardClick,
  handleDoubleClick,
  gridColumnId,
  rowSelectionColumnId,
}) => {
  const status = projectInfo?.statuses?.find((s) => s.name === entity.status)

  return (
    <InView key={entity.id} rootMargin="300px 0px 300px 0px" root={root}>
      {({ inView, ref }) =>
        inView ? (
          <div ref={ref} data-entity-id={entity.id}>
            <EntityCard
              tabIndex={0}
              style={{
                minWidth: 'unset',
                maxHeight: 'unset',
                minHeight: 90,
                maxWidth: 'unset',
              }}
              // data built in util transform function
              header={entity.header}
              path={entity.path}
              title={entity.title}
              titleIcon={entity.icon}
              imageIcon={entity.icon}
              status={status}
              imageUrl={entity.thumbnailUrl}
              isPlayable={entity.isPlayable}
              users={entity.author ? [{ name: entity.author }] : undefined} // versions only
              versions={entity.versions} // products only
              // for all types
              hidePriority
              // selection
              isActive={isEntitySelected(entity.id, entity.entityType)}
              // events
              onClick={(e) => handleCardClick(e, entity.id, index, gridColumnId)}
              onTitleClick={(e) => handleCardClick(e, entity.id, index, rowSelectionColumnId)}
              onVersionsClick={(e) => handleCardClick(e, entity.id, index, rowSelectionColumnId)}
              onDoubleClick={(e) => handleDoubleClick(e, entity.id)}
            />
          </div>
        ) : (
          <div
            ref={ref}
            style={{
              minWidth: 'unset',
              aspectRatio: '1.777777',
              backgroundColor: 'transparent',
            }}
          />
        )
      }
    </InView>
  )
}

VPGridCard.displayName = 'VPGridCard'
