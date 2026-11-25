// The versions related to a version (the other versions of its product) or to a task (the task's
// versions), newest first: thumbnail, name, author and status. A version opens in the slide-out.
import { StatusField, UserImagesStacked } from '@ynput/ayon-react-components'
import type { Status } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { useMemo } from 'react'

import { useGetVersionsByProductsQuery, useGetVersionsQuery } from '@shared/api'
import type { DetailsPanelEntityData, ProjectModel } from '@shared/api'
import { Thumbnail } from '@shared/components/Thumbnail'
import { useDetailsPanelContext } from '@shared/context'

import * as Styled from '../DetailsPanelTasks/DetailsPanelTasks.styled'

type User = { avatarUrl?: string; name: string; fullName?: string }

interface DetailsPanelVersionsProps {
  projectName: string
  entityType: 'version' | 'task'
  entity?: DetailsPanelEntityData
  projectInfo?: Partial<ProjectModel>
  users?: User[]
}

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''

export const DetailsPanelVersions = ({
  projectName,
  entityType,
  entity,
  projectInfo,
  users = [],
}: DetailsPanelVersionsProps) => {
  const { openSlideOut } = useDetailsPanelContext()
  const productId = entityType === 'version' ? entity?.product?.id : undefined
  const folderId = entityType === 'task' ? entity?.folder?.id : undefined

  const byProduct = useGetVersionsByProductsQuery(
    { projectName, productIds: productId ? [productId] : [], desc: true },
    { skip: !productId },
  )
  // a task's versions: those of its folder made in the task
  const byFolder = useGetVersionsQuery(
    { projectName, folderIds: folderId ? [folderId] : [], first: 200 },
    { skip: !folderId },
  )
  const { data, isFetching } = productId ? byProduct : byFolder

  const versions = useMemo(
    () =>
      [...(data?.versions ?? [])]
        .filter((version) => entityType !== 'task' || version.task?.id === entity?.id)
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
    [data, entityType, entity],
  )

  const statuses = useMemo(
    () => new Map((projectInfo?.statuses ?? []).map((status) => [status.name, status])),
    [projectInfo],
  )
  const usersByName = useMemo(() => new Map(users.map((user) => [user.name, user])), [users])

  if (!versions.length)
    return (
      <Styled.Empty>{isFetching || !entity ? 'Loading versions…' : 'No versions'}</Styled.Empty>
    )

  return (
    <Styled.List className={clsx('with-thumbnail', { loading: isFetching })}>
      {versions.map((version) => {
        const status = statuses.get(version.status)
        const author = version.author
          ? usersByName.get(version.author) ?? {
              name: version.author,
              avatarUrl: `/api/users/${encodeURIComponent(version.author)}/avatar`,
            }
          : undefined
        return (
          <Styled.Row
            key={version.id}
            className={clsx({ current: version.id === entity?.id })}
            onClick={() =>
              openSlideOut({ entityId: version.id, entityType: 'version', projectName })
            }
            data-testid="details-panel-version"
          >
            <Thumbnail
              projectName={projectName}
              entityType="version"
              entityId={version.id}
              thumbnailHash={version.thumbnailHash ?? undefined}
              icon="layers"
              showBorder={false}
              className="row-thumbnail"
            />
            <span className="name">
              {entityType === 'task' ? `${version.product?.name} ${version.name}` : version.name}
              <span className="folder">{formatDate(version.createdAt as string | undefined)}</span>
            </span>
            <span className="assignees">
              {author && (
                <UserImagesStacked
                  users={[author]}
                  size={20}
                  data-tooltip={author.fullName || author.name}
                />
              )}
            </span>
            {status ? (
              <StatusField
                status={status as Status}
                size="short"
                invert
                data-tooltip={status.name}
                className="status"
              />
            ) : (
              <span />
            )}
          </Styled.Row>
        )
      })}
    </Styled.List>
  )
}
