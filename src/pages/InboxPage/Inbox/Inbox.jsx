import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useEffect, useMemo, useRef, useState } from 'react'
import useKeydown from '../hooks/useKeydown'
import { classNames } from 'primereact/utils'
import InboxDetailsPanel from '../InboxDetailsPanel'
import { useDispatch } from 'react-redux'
import { useGetInboxQuery } from '/src/services/inbox/getInbox'
import { useGetProjectsInfoQuery } from '/src/services/userDashboard/getUserDashboard'
import Shortcuts from '/src/containers/Shortcuts'
import { highlightActivity } from '/src/features/details'
import useGroupMessages from '../hooks/useGroupMessages'
import { Button, Spacer } from '@ynput/ayon-react-components'
import { useUpdateInboxMessageMutation } from '/src/services/inbox/updateInbox'
import useCreateContext from '/src/hooks/useCreateContext'

const placeholderMessages = Array.from({ length: 30 }, (_, i) => ({
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
    data: { messages = [], projectNames = [] } = {},
    isFetching: isFetchingInbox,
    refetch,
  } = useGetInboxQuery({
    last: last,
    active: isActive,
    important: isImportant,
  })

  // update inbox message
  const [updateMessages] = useUpdateInboxMessageMutation()

  const { data: projectsInfo = {}, isFetching: isFetchingInfo } = useGetProjectsInfoQuery(
    { projects: projectNames },
    { skip: isFetchingInbox || !projectNames?.length },
  )

  // group messages of same entity and type together
  const groupedMessages = useGroupMessages({ messages })

  // single select only allow but multi select is possible
  // it always seems to become multi select so i'll just support it from the start
  const [selected, setSelected] = useState([])

  const listRef = useRef(null)

  // when tab changes, focus the first message and clear selected
  // we do this so that keyboard navigation works right away
  useEffect(() => {
    setSelected([])
    if (!listRef.current || isFetchingInbox) return

    listRef.current?.firstElementChild?.focus()
  }, [listRef, isFetchingInbox, filter])

  const handleUpdateMessages = (ids, status, projectName, isActiveChange = false) => {
    if (ids.length > 0) {
      // cacheKeyArgs are not used in the patch but are used to match the cache key to a query (for optimistic updates)
      const cacheKeyArgs = { last, active: isActive, important: isImportant, isActiveChange }
      // update the messages in the backend to toggle read status
      // we use optimistic updates inside updateMessages query
      updateMessages({
        status: status,
        projectName: projectName,
        ids: ids,
        ...cacheKeyArgs,
      })
    }
  }

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
    const activityIds = unReadMessages.map((m) => m.activityId)
    const idsToHighlight = activityIds.length > 0 ? activityIds : ids

    if (message?.activityType === 'comment') {
      // highlight the activity in the feed
      dispatch(highlightActivity({ isSlideOut: false, activityIds: idsToHighlight }))
    }

    const idsToMarkAsRead = unReadMessages.map((m) => m.referenceId)
    handleUpdateMessages(idsToMarkAsRead, 'read', message.projectName)
  }

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

  const [handleKeyDown, [usingKeyboard, setUsingKeyboard]] = useKeydown({
    messages: groupedMessages,
    onChange: handleMessageSelect,
    selected,
    listRef,
  })

  const messagesData = isFetchingInbox || isFetchingInfo ? placeholderMessages : groupedMessages

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

    console.log(id)

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

  const handleRefresh = () => {
    console.log('refetching inbox...')
    refetch()
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
        key: 'x',
        action: handleReadShortcut,
        closest: '.inbox-message',
        disabled: !isActive,
      },
      {
        key: 'r',
        action: handleRefresh,
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
        <Button label="Refresh (r)" icon="refresh" onClick={handleRefresh} />
      </Styled.Tools>
      <Styled.InboxSection direction="row">
        <Styled.MessagesList
          ref={listRef}
          onMouseMove={() => setUsingKeyboard(false)}
          onKeyDown={handleKeyDown}
          className={classNames({ isLoading: isFetchingInbox })}
        >
          {messagesData.map((group) => (
            <InboxMessage
              key={group.activityId}
              title={group.title}
              subTitle={group.subTitle}
              type={group.activityType}
              projectName={group.projectName}
              date={group.date}
              userName={group.userName}
              isRead={group.read || group.active}
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
        </Styled.MessagesList>
        <InboxDetailsPanel
          messages={messagesData}
          selected={selected}
          projectsInfo={projectsInfo}
        />
      </Styled.InboxSection>
    </>
  )
}

export default Inbox
