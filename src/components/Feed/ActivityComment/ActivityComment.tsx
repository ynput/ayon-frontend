import clsx from 'clsx'
import { useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppSelector } from '@state/store'
import emoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'

import CommentInput from '@components/CommentInput/CommentInput'
import MenuContainer from '@/components/Menu/MenuComponents/MenuContainer'
import Reactions from '@components/ReactionContainer/Reactions'
import { Reaction } from '@components/ReactionContainer/types'
import useReferenceTooltip from '@containers/Feed/hooks/useReferenceTooltip'
import FilesGrid from '@containers/FilesGrid/FilesGrid'
import { toggleMenuOpen } from '@/features/context'
import {
  useCreateReactionToActivityMutation,
  useDeleteReactionToActivityMutation,
} from '@queries/reaction/updateReaction'
import { $Any } from '@types'

import ActivityCommentMenu from '../ActivityCommentMenu/ActivityCommentMenu'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import { getTextRefs } from '../../CommentInput/quillToMarkdown'
import * as Styled from './ActivityComment.styled'
import CommentWrapper from './CommentWrapper'
import { aTag, blockquoteTag, codeTag, inputTag } from './activityMarkdownComponents'
import { mapGraphQLReactions } from './mappers'
import { Icon } from '@ynput/ayon-react-components'
import ActivityStatus from '../ActivityStatus/ActivityStatus'
import { Status } from '@api/rest/project'
import { useFeedContext } from '@context/FeedContext'

type Props = {
  activity: $Any
  onCheckChange: Function
  onDelete: Function
  onUpdate: Function
  projectInfo: $Any
  editProps: Object
  projectName: string
  entityType: string
  onReferenceClick: Function
  onFileExpand: Function
  showOrigin: boolean
  isHighlighted: boolean
  dispatch: Function
  scope: string
  statePath: string
  readOnly: boolean
  statuses: Status[]
}

const ActivityComment = ({
  activity = {},
  onCheckChange,
  onDelete,
  onUpdate,
  projectInfo,
  editProps = {},
  projectName,
  entityType,
  onReferenceClick,
  onFileExpand,
  showOrigin,
  isHighlighted,
  dispatch,
  scope,
  statePath,
  readOnly,
  statuses = [],
}: Props) => {
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
  let menuId = `comment-${scope}-${activity.activityId}`
  if (statePath) menuId += '-' + statePath
  const isMenuOpen = useAppSelector((state) => state.context.menuOpen) === !!menuId
  const user = useAppSelector((state) => state.user)

  const [deleteReactionToActivity] = useDeleteReactionToActivityMutation()
  const [createReactionToActivity] = useCreateReactionToActivityMutation()

  const { editingId, setEditingId } = useFeedContext()

  const handleEditComment = () => {
    setEditingId(activityId)
  }

  const handleEditCancel = () => {
    // close the edit comment
    setEditingId(null)
  }

  const handleSave = async (value: $Any, files: $Any) => {
    await onUpdate(value, files)
    setEditingId(null)
  }

  const isEditing = editingId === activityId

  const isRef = referenceType !== 'origin' || showOrigin

  const handleDelete = () => {
    const refs = getTextRefs(body)

    // if the comment is a reference, (it's origin is not the entity)
    // we need to delete the reference from the origin as well
    // add it to the refs to delete
    if (isRef && origin) {
      refs.push({ id: origin.id, type: origin.type })
    }

    // note: body is used to match other refs to delete
    onDelete && onDelete(activityId, entityId, refs)
  }

  const handleToggleMenu = (menu: $Any) => dispatch(toggleMenuOpen(menu))
  const moreRef = useRef<HTMLDivElement>(null)

  const [, setRefTooltip] = useReferenceTooltip({ dispatch })

  const mappedReactions = useMemo(
    () => mapGraphQLReactions(activity.reactions, user.name),
    [[...(activity.reactions || [])]],
  )

  const reactionChangeHandler = (reaction: Reaction) => {
    if (reaction.isActive) {
      createReactionToActivity({
        projectName: projectName,
        // @ts-ignore exposed endpoint doesn't need the username, we still need to pass it for the optismistic update
        userName: user.name,
        activityId: activityId,
        createReactionModel: {
          reaction: reaction.type,
        },
      })
    } else {
      deleteReactionToActivity({
        projectName: projectName,
        // @ts-ignore exposed endpoint doesn't need the username, we still need to pass it for the optismistic update
        userName: user.name,
        activityId: activityId,
        reaction: reaction.type,
      })
    }
  }

  return (
    <>
      <Styled.Comment
        className={clsx('comment', { isOwner, isMenuOpen, isEditing, isHighlighted })}
        id={activityId}
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
            <Styled.Tools className={'tools'} ref={moreRef}>
              {isOwner && handleEditComment && (
                <Styled.ToolButton icon="edit_square" onClick={handleEditComment} />
              )}
              {isOwner && (
                <Styled.ToolButton
                  icon="more_horiz"
                  className="more"
                  onClick={() => handleToggleMenu(menuId)}
                />
              )}
            </Styled.Tools>
          )}
          {isEditing ? (
            // @ts-ignore
            <CommentInput
              isOpen={true}
              initValue={body}
              initFiles={files}
              isEditing
              onClose={handleEditCancel}
              onSubmit={handleSave}
              projectInfo={projectInfo}
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
                    a: (props) =>
                      // @ts-ignore
                      aTag(props, {
                        entityId,
                        projectName,
                        projectInfo,
                        onReferenceClick,
                        onReferenceTooltip: setRefTooltip,
                        activityId,
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
                onRemove={undefined}
              />
            </>
          )}

          {!readOnly && (
            <MenuContainer id={menuId} target={moreRef.current}>
              <ActivityCommentMenu onDelete={() => isOwner && handleDelete()} />
            </MenuContainer>
          )}
          {!isEditing && (
            <div style={{ marginTop: '16px' }}>
              {mappedReactions && (
                <Reactions
                  reactions={mappedReactions}
                  changeHandler={reactionChangeHandler}
                  readOnly={readOnly}
                />
              )}
            </div>
          )}
        </Styled.Body>
      </Styled.Comment>
    </>
  )
}

export default ActivityComment
