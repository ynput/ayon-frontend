import { useRef, useState } from 'react'
import * as Styled from './ActivityComment.styled'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import ReactMarkdown from 'react-markdown'
import CommentWrapper from './CommentWrapper'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import clsx from 'clsx'
import { useSelector } from 'react-redux'
import CommentInput from '@components/CommentInput/CommentInput'
import { aTag, blockquoteTag, codeTag, inputTag } from './activityMarkdownComponents'
import FilesGrid from '@containers/FilesGrid/FilesGrid'
import useReferenceTooltip from '@containers/Feed/hooks/useReferenceTooltip'
import { getTextRefs } from '../../CommentInput/quillToMarkdown'
import MenuContainer from '@/components/Menu/MenuComponents/MenuContainer'
import ActivityCommentMenu from '../ActivityCommentMenu/ActivityCommentMenu'
import { toggleMenuOpen } from '@/features/context'
import { mockReactions, updateReactionData } from '@components/ReactionContainer/values'
import Reactions from '@components/ReactionContainer/Reactions'
import { $Any } from '@types'

type Props = {
  activity: $Any,
  onCheckChange: Function,
  onDelete: Function,
  onUpdate: Function,
  projectInfo: $Any,
  editProps: Object,
  projectName: string,
  entityType: string,
  onReferenceClick: Function,
  isSlideOut: boolean,
  onFileExpand: Function,
  showOrigin: boolean,
  isHighlighted: boolean,
  dispatch: Function,
  scope: string,

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
  isSlideOut,
  onFileExpand,
  showOrigin,
  isHighlighted,
  dispatch,
  scope,
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
  if (isSlideOut) menuId += '-slideout'
  const isMenuOpen = useSelector((state: $Any) => state.context.menuOpen) === menuId

  // EDITING
  const [isEditing, setIsEditing] = useState(false)
  const [reactions, setReactions] = useState(mockReactions)

  const handleEditComment = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async (value: $Any, files: $Any) => {
    await onUpdate(value, files)
    // this won't run if the update fails
    setIsEditing(false)
  }

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
  const moreRef = useRef()

  const [, setRefTooltip] = useReferenceTooltip({ dispatch })

  const reactionChangeHandler = (reaction: Reaction) => {
    setReactions(updateReactionData(reactions, reaction))
  }

  return (
    <>
      <Styled.Comment
        className={clsx('comment', { isOwner, isMenuOpen, isEditing, isHighlighted })}
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
          {/* @ts-ignore */}
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
                  remarkPlugins={[remarkGfm, emoji]}
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
                  }}
                >
                  {body}
                </ReactMarkdown>
              </CommentWrapper>
              {/* file uploads */}
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

          {/* @ts-ignore */}
          <MenuContainer id={menuId} target={moreRef.current}>
            <ActivityCommentMenu onDelete={() => isOwner && handleDelete()} />
          </MenuContainer>
          <div style={{marginTop: '16px'}}>
          <Reactions reactions={reactions} changeHandler={reactionChangeHandler} />
          </div>
        </Styled.Body>
      </Styled.Comment>
    </>
  )
}

export default ActivityComment
