import clsx from 'clsx'
import { useCallback, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import emoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'

import CommentInput from '../CommentInput/CommentInput'
import Reactions from '../ReactionContainer/Reactions'
import { Reaction } from '../ReactionContainer/types'
import useReferenceTooltip from '../../hooks/useReferenceTooltip'
import FilesGrid, { FilesGridProps } from '../FilesGrid/FilesGrid'

import { getTextRefs } from '../CommentInput/quillToMarkdown'
import * as Styled from './ActivityComment.styled'
import CommentWrapper from './CommentWrapper'
import { aTag, blockquoteTag, codeTag, inputTag } from './ActivityMarkdownComponents'
import { mapGraphQLReactions } from './mappers'
import { Icon } from '@ynput/ayon-react-components'
import ActivityStatus from '../ActivityStatus/ActivityStatus'
import { useFeedContext } from '../../context/FeedContext'
import { confirmDelete } from '../../../../util'
import ActivityHeader, { ActivityHeaderProps } from '../ActivityHeader/ActivityHeader'
import { MenuContainer } from '@shared/components'
import { useMenuContext } from '@shared/context'
import type { Status } from '../../../ProjectTreeTable/types/project'
import { SavedAnnotationMetadata } from '../../index'
import { useDetailsPanelContext } from '@shared/context'
import { useBlendedCategoryColor } from '../CommentInput/hooks/useBlendedCategoryColor'
import { CategoryTag } from '../ActivityCategorySelect/CategoryTag'
import ActivityCommentMenu from './ActivityCommentMenu'

type Props = {
  activity: any
  onCheckChange?: Function
  onDelete?: (activityId: string, entityId: string, refs: any) => Promise<void>
  onUpdate?: (value: any, files: any, refs?: any, data?: any) => Promise<void>
  projectInfo: any
  editProps?: {
    disabled: boolean
    isLoading: boolean
  }
  projectName: string
  entityType: string
  onReferenceClick?: ActivityHeaderProps['onReferenceClick']
  onFileExpand?: FilesGridProps['onExpand']
  showOrigin?: boolean
  isHighlighted?: boolean
  readOnly?: boolean
  statuses: Status[]
}

const ActivityComment = ({
  activity = {},
  onCheckChange,
  onDelete,
  onUpdate,
  projectInfo,
  editProps,
  projectName,
  entityType,
  onReferenceClick,
  onFileExpand,
  showOrigin,
  isHighlighted,
  readOnly,
  statuses = [],
}: Props) => {
  const { userName, createReaction, deleteReaction, editingId, setEditingId, categories, isGuest } =
    useFeedContext()

  const moreRef = useRef<HTMLButtonElement>(null)
  const { toggleMenuOpen, menuOpen } = useMenuContext()

  const categoryData = useMemo(() => {
    return categories.find((cat) => cat.name === activity.activityData?.category) || null
  }, [activity?.activityData?.category, categories])
  // Compute blended background color for category
  const blendedCategoryColor = useBlendedCategoryColor(categoryData?.color)

  let {
    body,
    authorName,
    authorFullName,
    createdAt,
    referenceType,
    entityId,
    activityId,
    author,
    isOwner,
    files = [],
    origin,
  } = activity
  if (!authorName) authorName = author?.name || ''
  if (!authorFullName) authorFullName = author?.fullName || authorName

  const menuId = `activity-comment-menu-${activityId}-${referenceType}`
  const isMenuOpen = menuOpen === menuId

  const { onGoToFrame, setHighlightedActivities } = useDetailsPanelContext()

  const handleEditComment = () => {
    setEditingId(activityId)
  }

  const handleEditCancel = () => {
    // close the edit comment
    setEditingId(null)
  }

  const handleSave = async (value: any, files: any, data?: any) => {
    await onUpdate?.(value, files, undefined, data)
    setEditingId(null)
  }

  const isEditing = editingId === activityId

  const isRef = referenceType !== 'origin' || showOrigin

  const handleDelete = async () => {
    const refs = getTextRefs(body)

    // if the comment is a reference, (it's origin is not the entity)
    // we need to delete the reference from the origin as well
    // add it to the refs to delete
    if (isRef && origin) {
      refs.push({ id: origin.id, type: origin.type })
    }

    // note: body is used to match other refs to delete
    onDelete && (await onDelete(activityId, entityId, refs))
  }

  const deleteConfirmation = () => {
    confirmDelete({
      title: 'Delete comment',
      message: 'Are you sure you want to delete this comment?',
      accept: async () => {
        await handleDelete()
      },
    })
  }

  const [, setRefTooltip] = useReferenceTooltip()

  const mappedReactions = useMemo(
    () => mapGraphQLReactions(activity.reactions, userName),
    [[...(activity.reactions || [])]],
  )

  const reactionChangeHandler = (reaction: Reaction) => {
    if (reaction.isActive) {
      createReaction({
        projectName: projectName,
        // @ts-ignore exposed endpoint doesn't need the username, we still need to pass it for the optimistic update
        userName: userName,
        activityId: activityId,
        createReactionModel: {
          reaction: reaction.type,
        },
      })
    } else {
      deleteReaction({
        projectName: projectName,
        // @ts-ignore exposed endpoint doesn't need the username, we still need to pass it for the optimistic update
        userName: userName,
        activityId: activityId,
        reaction: reaction.type,
      })
    }
  }

  const onAnnotationClick = useCallback(
    (file: any) => {
      if (!file.annotation) return
      // annotation frame numbers are 1-based
      onGoToFrame?.((file.annotation as SavedAnnotationMetadata).range[0])
      setHighlightedActivities([activityId])
    },
    [onGoToFrame],
  )

  return (
    <>
      <Styled.Comment
        className={clsx('comment', {
          isOwner,
          isEditing,
          isHighlighted,
          category: !!categoryData && !isGuest,
          menuOpen: isMenuOpen,
        })}
        id={activityId}
        $categoryPrimary={categoryData?.color}
        $categoryTertiary={blendedCategoryColor.primary}
        $categorySecondary={blendedCategoryColor.secondary}
      >
        <ActivityHeader
          name={authorName}
          fullName={authorFullName}
          date={createdAt}
          isRef={isRef}
          activity={activity}
          // projectInfo={projectInfo}
          projectName={projectName}
          entityType={entityType}
          onReferenceClick={onReferenceClick}
          onReferenceTooltip={setRefTooltip}
          children={undefined}
        />
        <Styled.Body className={clsx('comment-body', { isEditing })}>
          {!readOnly && (
            <Styled.Tools className={'tools'}>
              {isOwner && handleEditComment && (
                <Styled.ToolButton icon="edit_square" onClick={handleEditComment} variant="text" />
              )}
              <Styled.ToolButton
                icon="more_horiz"
                ref={moreRef}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMenuOpen(menuId)
                }}
                className={isMenuOpen ? 'active' : ''}
              />
            </Styled.Tools>
          )}

          {!isEditing && !isGuest && categoryData && (
            <CategoryTag
              value={categoryData.name}
              color={categoryData.color}
              style={{
                top: -4,
                left: -4,
              }}
              isCompact
            />
          )}

          {isEditing ? (
            <CommentInput
              initValue={body}
              initFiles={files}
              initCategory={categoryData?.name}
              isEditing
              onClose={handleEditCancel}
              onSubmit={handleSave}
              isOpen={true}
              {...editProps}
            />
          ) : (
            <>
              <CommentWrapper>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, emoji, remarkDirective, remarkDirectiveRehype]}
                  urlTransform={(url) => url}
                  components={{
                    // a links
                    // @ts-ignore
                    a: (props) =>
                      // @ts-ignore
                      aTag(props, {
                        entityId,
                        projectName,
                        projectInfo,
                        onReferenceClick,
                        onReferenceTooltip: setRefTooltip,
                        activityId,
                        categoryPrimary: categoryData?.color,
                        categorySecondary: blendedCategoryColor.secondary,
                      }),
                    // checkbox inputs
                    // @ts-ignore
                    input: (props) => inputTag(props, { activity, onCheckChange }),
                    // code syntax highlighting
                    // eslint-disable-next-line
                    // @ts-ignore
                    code: (props) => codeTag(props),
                    // @ts-ignore
                    blockquote: (props) => blockquoteTag(props),
                    // @ts-ignore
                    tip: (props) => (
                      <Styled.Tip>
                        <Icon icon="info" />
                        {props.children}
                      </Styled.Tip>
                    ),
                    // @ts-ignore
                    status: (props) => {
                      return (
                        <ActivityStatus name={props.id} statuses={statuses}>
                          {props.children}
                        </ActivityStatus>
                      )
                    },
                  }}
                >
                  {body}
                </ReactMarkdown>
              </CommentWrapper>
              {/* file uploads */}
              {/* @ts-ignore */}
              <FilesGrid
                files={files}
                isCompact={files.length > 6}
                activityId={activityId}
                projectName={projectName}
                isDownloadable
                onExpand={onFileExpand}
                onAnnotationClick={onAnnotationClick}
                onRemove={undefined}
              />
            </>
          )}

          {!isEditing && (
            <div style={{ marginTop: '16px' }}>
              {mappedReactions && (
                <Reactions
                  reactions={mappedReactions}
                  changeHandler={reactionChangeHandler}
                  readOnly={readOnly}
                  category={categoryData && !isGuest ? categoryData.name : undefined}
                  categoryPrimary={categoryData?.color}
                  categorySecondary={blendedCategoryColor.secondary}
                  categoryTertiary={blendedCategoryColor.primary}
                />
              )}
            </div>
          )}
        </Styled.Body>
      </Styled.Comment>

      <MenuContainer
        target={moreRef.current}
        id={menuId}
        align="right"
        onClose={(e: any) => {
          e?.stopPropagation()
          toggleMenuOpen(false)
        }}
      >
        <ActivityCommentMenu
          onDelete={isOwner && onDelete ? deleteConfirmation : undefined}
          onEdit={isOwner && handleEditComment}
          activityId={activityId}
          onSelect={() => toggleMenuOpen(false)}
          projectName={projectName}
        />
      </MenuContainer>
    </>
  )
}

export default ActivityComment
