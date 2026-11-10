import { memo } from 'react'
import { Thumbnail } from '@shared/components'
import type { MatchingFolder } from '@shared/containers/ProjectTreeTable'
import type { FolderType } from '@shared/api'
import * as Styled from './MobileOverview.styled'
import MobileFieldValue from './MobileFieldValue'
import { formatFrameRange, getTaskFieldValues, type TaskField } from './MobileTaskRowHelpers'

type User = { name: string; fullName?: string }

type Props = {
  folder: MatchingFolder
  projectName: string
  folderType?: FolderType
  usersByName: Map<string, User>
  fields: TaskField[] | null
  hideEmpty: boolean
  indent: number
  onOpen: (folderId: string) => void
}

const MobileFolderSummary = ({
  folder,
  projectName,
  folderType,
  usersByName,
  fields,
  hideEmpty,
  indent,
  onOpen,
}: Props) => {
  const values = fields ? getTaskFieldValues(folder, fields, usersByName, hideEmpty) : []
  const frameRange = fields ? undefined : formatFrameRange(folder.attrib ?? undefined)
  const fps = fields ? undefined : folder.attrib?.fps

  return (
    <Styled.FolderCardBody
      type="button"
      $indent={indent}
      aria-label={`Open details for ${folder.label || folder.name}`}
      onClick={() => onOpen(folder.id)}
    >
      <Styled.ThumbnailBox>
        <Thumbnail
          projectName={projectName}
          entityType="folder"
          entityId={folder.id}
          thumbnailHash={folder.thumbnailHash || undefined}
          icon={folderType?.icon}
          showBorder={false}
        />
      </Styled.ThumbnailBox>
      <Styled.TaskText>
        <Styled.TaskMeta>
          <span>{folderType?.name ?? folder.folderType}</span>
          {frameRange && <span>{frameRange}</span>}
          {fps && <span>{fps} fps</span>}
          {values.map((value) => (
            <MobileFieldValue key={value.id} value={value} />
          ))}
        </Styled.TaskMeta>
      </Styled.TaskText>
    </Styled.FolderCardBody>
  )
}

export default memo(MobileFolderSummary)
