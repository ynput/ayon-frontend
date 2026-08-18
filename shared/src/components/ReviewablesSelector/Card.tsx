import clsx from 'clsx'
import { FileThumbnail } from '../FileThumbnail'
import type { ReviewableModel } from '@shared/api'
import type { ContextMenuItemType } from '@shared/containers/ContextMenu/useCreateContextMenu'
import { useCreateContextMenu } from '@shared/containers/ContextMenu/useCreateContextMenu'
import * as Styled from './ReviewablesSelector.styled'
import { KeyboardEvent, MouseEvent } from 'react'

export type ReviewableCard = Pick<ReviewableModel, 'fileId' | 'label'> & {
  tag?: JSX.Element
  contextMenuItems?: ContextMenuItemType[]
  selectionVariant?: 'primary' | 'tertiary'
}

export type ReviewableCardProps = ReviewableCard & {
  projectName: string | null
  selected: boolean
  onChange?: (fileId: string, modifier?: boolean) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onMouseOver: (event: MouseEvent<HTMLDivElement>, { label }: { label?: string }) => void
}

export default function Card({
  fileId,
  label,
  selected,
  projectName,
  onKeyDown,
  onMouseOver,
  onChange,
  tag,
  contextMenuItems,
  selectionVariant = 'primary',
}: ReviewableCardProps) {
  const [contextMenuShow] = useCreateContextMenu()

  return (
    <Styled.ReviewableCard
      key={fileId}
      id={'preview-' + fileId}
      onClick={(event) => onChange?.(fileId, event.metaKey || event.ctrlKey)}
      className={clsx('reviewable-card', { selected }, selectionVariant)}
      onMouseOver={(e) => onMouseOver(e, { label })}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => {
        if (!contextMenuItems) return

        event.preventDefault()
        contextMenuShow(event, contextMenuItems)
      }}
      tabIndex={0}
    >
      <FileThumbnail src={`/api/projects/${projectName}/files/${fileId}/thumbnail`} />
      {tag && <Styled.Tag>{tag}</Styled.Tag>}
    </Styled.ReviewableCard>
  )
}
