import type { CommentFrameLink } from '@shared/context'
import type { CommentFlag } from './CommentFlags'

type CreateCommentFlagsOptions = {
  category: { name: string } | null | undefined
  categoryNotFound: boolean
  frameLink: CommentFrameLink | null
  formatFrame: (frame: number) => string
  onFrameLinkClick: () => void
  canNavigateToFrame: boolean
  isGuest: boolean
}

export const createCommentFlags = ({
  category,
  categoryNotFound,
  frameLink,
  formatFrame,
  onFrameLinkClick,
  canNavigateToFrame,
  isGuest,
}: CreateCommentFlagsOptions): CommentFlag[] => [
  ...(!isGuest && category
    ? [
        {
          id: 'category',
          label: category.name,
          tooltip: categoryNotFound
            ? 'Category not found. It may have been deleted.'
            : `Category: ${category.name}`,
        },
      ]
    : []),
  ...(frameLink
    ? [
        {
          id: 'frame',
          label:
            frameLink.endFrame > frameLink.startFrame
              ? `${formatFrame(frameLink.startFrame)}-${formatFrame(frameLink.endFrame)}`
              : formatFrame(frameLink.startFrame),
          icon: 'timer' as const,
          tooltip:
            frameLink.endFrame > frameLink.startFrame
              ? 'Go to frames and set in/out points'
              : 'Go to frame',
          onClick: onFrameLinkClick,
          disabled: !canNavigateToFrame,
          testId: 'comment-frame-link-chip',
        },
      ]
    : []),
]
