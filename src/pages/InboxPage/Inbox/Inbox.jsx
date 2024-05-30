import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useEffect, useMemo, useRef, useState } from 'react'
import useKeydown from '../hooks/useKeydown'
import { classNames } from 'primereact/utils'
import InboxDetailsPanel from '../InboxDetailsPanel'
import { useDispatch } from 'react-redux'
import { useGetInboxQuery, useLazyGetInboxQuery } from '/src/services/inbox/getInbox'
import { useGetProjectsInfoQuery } from '/src/services/userDashboard/getUserDashboard'
import Shortcuts from '/src/containers/Shortcuts'
import { clearHighlights, highlightActivity } from '/src/features/details'
import useGroupMessages from '../hooks/useGroupMessages'
import { Button, Icon, Spacer } from '@ynput/ayon-react-components'
import useUpdateInboxMessage from '../hooks/useUpdateInboxMessage'
import useCreateContext from '/src/hooks/useCreateContext'
import { InView } from 'react-intersection-observer'
import useInboxRefresh from '../hooks/useInboxRefresh'
import { toast } from 'react-toastify'
import { compareAsc } from 'date-fns'
import ShortcutWidget from '/src/components/ShortcutWidget/ShortcutWidget'
import Typography from '/src/theme/typography.module.css'

const placeholderMessages = Array.from({ length: 100 }, (_, i) => ({
  activityId: `placeholder-${i}`,
  folderName: 'Loading...',
  thumbnail: { icon: 'folder' },
  read: false,
  isPlaceholder: true,
}))

const filters = {
  important: { active: true, important: true },
  other: { active: true, important: false },
  cleared: { active: false, important: null },
}

const Inbox = ({ filter }) => {
  const dispatch = useDispatch()

  const last = 100
  const filterArgs = filters[filter] || {}
  const isActive = filterArgs.active
  const isImportant = filterArgs.important

  const {
    data: { messages = [], projectNames = [], pageInfo } = {},
    isLoading: isLoadingInbox,
    isFetching: isFetchingInbox,
    error: errorInbox,
    refetch,
  } = useGetInboxQuery({
    last: last,
    active: isActive,
    important: isImportant,
  })

  const { hasPreviousPage, endCursor: lastCursor } = pageInfo || {}

  const [getInboxMessages] = useLazyGetInboxQuery()
  // load more messages
  const handleLoadMore = () => {
    if (!hasPreviousPage || isFetchingInbox) return

    getInboxMessages({ last, active: isActive, important: isImportant, cursor: lastCursor })
  }

  const { data: projectsInfo = {}, isLoading: isLoadingInfo } = useGetProjectsInfoQuery(
    { projects: projectNames },
    { skip: isLoadingInbox || !projectNames?.length },
  )

  const handleUpdateMessages = useUpdateInboxMessage({
    last,
    isActive,
    isImportant,
  })

  //   now sort the messages by createdAt using the compare function
  const messagesSortedByDate = useMemo(
    () =>
      [...messages].sort((a, b) =>
        isActive ? compareAsc(new Date(b.createdAt), new Date(a.createdAt)) : messages,
      ),
    [messages, isActive],
  )

  // group messages of same entity and type together
  const groupedMessages = useGroupMessages({ messages: messagesSortedByDate })

  // single select only allow but multi select is possible
  // it always seems to become multi select so i'll just support it from the start
  const [selected, setSelected] = useState([])

  const listRef = useRef(null)

  // when tab changes, focus the first message and clear selected
  // we do this so that keyboard navigation works right away
  useEffect(() => {
    setSelected([])
    if (!listRef.current || isLoadingInbox) return

    listRef.current?.firstElementChild?.focus()
  }, [listRef, isLoadingInbox, filter])

  const handleToggleReadMessage = (id) => {
    // get all the messages in the group
    const group = groupedMessages.find((m) => m.activityId === id)
    // if no group is found, return
    if (!group) return
    // are all the messages in the group read?
    const allRead = group.messages.every((m) => m.read)
    // get all the reference ids of the messages
    const referenceIds = group.messages.map((m) => m.referenceId)

    // update the messages
    handleUpdateMessages(referenceIds, allRead ? 'unread' : 'read', group.projectName)
  }

  const handleMessageSelect = async (id, ids = []) => {
    if (id.includes('placeholder')) return
    // if the message is already selected, deselect it
    let newSelection = []
    if (selected.includes(id)) {
      newSelection = selected.filter((s) => s !== id)
      setSelected(newSelection)
      return
    } else {
      newSelection = [id]
    }

    // select the message
    setSelected(newSelection)

    // get messages and check if it has been read
    const message = groupedMessages.find((m) => m.activityId === id)
    const group = message?.messages || []
    const unReadMessages = group.filter((m) => !m.read)
    const activityIds = group.map((m) => m.activityId)
    const idsToHighlight = activityIds.length > 0 ? activityIds : ids

    if (message?.activityType === 'comment' && idsToHighlight.length > 0) {
      // highlight the activity in the feed
      dispatch(highlightActivity({ isSlideOut: false, activityIds: idsToHighlight }))
    } else {
      dispatch(clearHighlights, { isSlideOut: false })
    }

    const idsToMarkAsRead = unReadMessages.map((m) => m.referenceId)
    handleUpdateMessages(idsToMarkAsRead, 'read', message.projectName)
  }

  // REFRESH INBOX
  const [refreshInbox, { isRefreshing }] = useInboxRefresh({
    isFetching: isFetchingInbox,
    refetch,
    dispatch,
  })

  const [handleKeyDown, [usingKeyboard, setUsingKeyboard]] = useKeydown({
    messages: groupedMessages,
    onChange: handleMessageSelect,
    selected,
    listRef,
  })

  const clearMessages = async (id, messagesToClear = [], projectName) => {
    if (selected.length) {
      // select next message in the list
      const selectedMessageIndex = groupedMessages.findIndex((m) => m.activityId === id)
      const nextMessage = groupedMessages[selectedMessageIndex + 1]
      if (nextMessage) handleMessageSelect(nextMessage.activityId)
      else setSelected([])
    } else setSelected([])

    const idsToClear = messagesToClear.map((m) => m.referenceId)
    const status = isActive ? 'inactive' : 'unread'

    handleUpdateMessages(idsToClear, status, projectName, true)
  }

  const handleClearMessage = (id) => {
    // find the group message with id
    const group = groupedMessages.find((g) => g.activityId === id)
    const projectName = group?.projectName
    if (!group) return

    clearMessages(id, group.messages, projectName)
  }

  const handleClearAll = async () => {
    // first group messages by projectName
    const groupedByProject = messages.reduce((acc, message) => {
      if (!acc[message.projectName]) acc[message.projectName] = []
      acc[message.projectName].push(message)
      return acc
    }, {})

    let promises = []
    // for each project, clear all messages
    for (const [projectName, messages] of Object.entries(groupedByProject)) {
      const promise = clearMessages(null, messages, projectName)
      promises.push(promise)
    }

    try {
      await Promise.all(promises)
      toast.success('All messages cleared')

      // refresh the inbox to get any new messages
      if (hasPreviousPage) handleLoadMore()
    } catch (error) {
      console.error(error)
    }
  }

  const isLoadingAny = isLoadingInbox || isLoadingInfo || isRefreshing

  const messagesData = isLoadingAny ? placeholderMessages : groupedMessages

  const getHoveredMessageId = (e, closest = '') => {
    // get the message list item
    const target = e.target.closest('.inbox-message' + closest)
    if (!target) return
    // check target has id 'message-{id}` and extract the id
    const [type, id] = target.id.split('-')
    if (type !== 'message' || !id) return null

    return id
  }

  const handleReadShortcut = (e) => {
    const id = getHoveredMessageId(e)
    if (!id) return

    handleToggleReadMessage(id)
  }

  const handleClearShortcut = (e) => {
    const id = getHoveredMessageId(e, '.isClearable')
    if (!id) return

    // if something is selected, check if the selected message is the same as the target
    // if it is, clear it
    if (selected.length) {
      if (selected.includes(id)) handleClearMessage(id)
    } else {
      // if nothing is selected, clear the target
      handleClearMessage(id)
    }
  }

  const contextMenu = (id) => {
    // find the group message with id
    const group = groupedMessages.find((g) => g.activityId === id)

    if (!group) return [{ label: 'No message selected', disabled: true }]
    const referenceIds = group.messages.map((m) => m.referenceId)
    const isRead = group.read

    return [
      {
        id: 'clear',
        label: isActive ? 'Clear' : 'Unclear',
        icon: isActive ? 'done' : 'replay',
        shortcut: 'c',
        command: () => clearMessages(id, group.messages, group.projectName),
      },
      {
        id: isRead ? 'unread' : 'read',
        label: isRead ? 'Mark as unread' : 'Mark as read',
        icon: isRead ? 'mark_email_unread' : 'drafts',
        disabled: !isActive,
        shortcut: 'x',
        command: () =>
          handleUpdateMessages(referenceIds, isRead ? 'unread' : 'read', group.projectName),
      },
    ]
  }

  const [ctxMenuShow] = useCreateContext([])

  const handleContextMenu = (e) => {
    // get id from the target
    const target = e.target.closest('li')
    const id = target?.id.split('-')[1]

    if (!id) return

    // update selection
    setSelected([id])

    // open context menu
    ctxMenuShow(e, contextMenu(id))
  }

  const shortcuts = useMemo(
    () => [
      {
        key: 'c',
        action: handleClearShortcut,
        closest: '.inbox-message',
      },
      {
        key: 'C',
        action: handleClearAll,
      },
      {
        key: 'x',
        action: handleReadShortcut,
        closest: '.inbox-message',
        disabled: !isActive,
      },
      {
        key: 'r',
        action: refreshInbox,
      },
    ],
    [messagesData, selected],
  )

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[messagesData, selected]} />
      <Styled.Tools>
        {/* <InputText placeholder="Search..." /> */}
        <Spacer />
        {isActive && (
          <Button
            label="Clear all"
            icon="done_all"
            onClick={handleClearAll}
            disabled={!messages.length}
          >
            <ShortcutWidget>Shift+C</ShortcutWidget>
          </Button>
        )}
        <Button label="Refresh" icon="refresh" onClick={refreshInbox}>
          <ShortcutWidget>R</ShortcutWidget>
        </Button>
      </Styled.Tools>
      <Styled.InboxSection direction="row">
        <Styled.MessagesList
          ref={listRef}
          onMouseMove={() => setUsingKeyboard(false)}
          onKeyDown={handleKeyDown}
          className={classNames({ isLoading: isLoadingInbox })}
        >
          {messagesData.map((group) => (
            <InboxMessage
              key={group.activityId}
              path={group.path}
              type={group.activityType}
              entityType={group.entityType}
              entityId={group.entityId}
              projectName={group.projectName}
              date={group.date}
              userName={group.userName}
              isRead={group.read || group.active}
              unReadCount={group.unRead}
              onSelect={handleMessageSelect}
              isSelected={selected.includes(group.activityId)}
              disableHover={usingKeyboard}
              onClear={
                !selected.length || selected.includes(group.activityId)
                  ? () => handleClearMessage(group.activityId)
                  : undefined
              }
              clearLabel={isActive ? 'Clear' : 'Unclear'}
              clearIcon={isActive ? 'done' : 'replay'}
              id={group.activityId}
              ids={group.groupIds}
              messages={group.messages}
              changes={group.changes}
              isPlaceholder={group.isPlaceholder}
              projectsInfo={projectsInfo}
              isMultiple={group.isMultiple}
              onContextMenu={handleContextMenu}
            />
          ))}
          {hasPreviousPage && !isLoadingInbox && (
            <InView
              onChange={(inView) => inView && handleLoadMore()}
              rootMargin={'0px 0px 500px 0px'}
              root={listRef.current}
            >
              <Styled.LoadMore onClick={handleLoadMore}>
                {isFetchingInbox ? 'Loading more...' : 'Load more'}
              </Styled.LoadMore>
            </InView>
          )}
        </Styled.MessagesList>
        <InboxDetailsPanel
          messages={messagesData}
          selected={selected}
          projectsInfo={projectsInfo}
        />
        {!messagesData.length && !isLoadingAny && !errorInbox && (
          <Styled.NoMessages>
            <Icon icon="done_all" />
            <h3 className={Typography.titleLarge}>All caught up! No messages to show.</h3>
          </Styled.NoMessages>
        )}
        {errorInbox && !isLoadingAny && (
          <Styled.NoMessages className={'isError'}>
            <Icon icon="error" />
            <h3 className={Typography.titleLarge}>Something went wrong getting the inbox.</h3>
            <span className="error-message">{errorInbox}</span>
          </Styled.NoMessages>
        )}
      </Styled.InboxSection>
    </>
  )
}

export default Inbox
