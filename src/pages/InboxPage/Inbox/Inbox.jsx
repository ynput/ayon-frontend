import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useEffect, useMemo, useRef, useState } from 'react'
import useKeydown from '../hooks/useKeydown'
import { classNames } from 'primereact/utils'
import InboxDetailsPanel from '../InboxDetailsPanel'
import { usePrefetchEntity } from '../../UserDashboardPage/util'
import { useDispatch, useSelector } from 'react-redux'
import { useGetInboxQuery } from '/src/services/inbox/getInbox'
import { useGetProjectsInfoQuery } from '/src/services/userDashboard/getUserDashboard'
import { ayonApi } from '/src/services/ayon'
import Shortcuts from '/src/containers/Shortcuts'
import { highlightActivity } from '/src/features/details'
import useGroupMessages from '../hooks/useGroupMessages'
import { Button, InputText, Spacer } from '@ynput/ayon-react-components'
import usePrefetchFilters from '../hooks/usePrefetchFilters'

const placeholderMessages = Array.from({ length: 30 }, (_, i) => ({
  activityId: `placeholder-${i}`,
  folderName: 'Loading...',
  thumbnail: { icon: 'folder' },
  isRead: false,
  isPlaceholder: true,
}))

const activityTypesFilters = {
  important: ['comment', 'version.publish', 'status.change'],
  other: ['assignee.add', 'assignee.remove'],
  cleared: ['comment', 'version.publish', 'status.change', 'assignee.add', 'assignee.remove'],
}

const Inbox = ({ filter }) => {
  const dispatch = useDispatch()
  const userName = useSelector((state) => state.user.name)

  const last = 30

  let activityTypes = []
  if ('important' === filter) {
    activityTypes = activityTypesFilters.important
  } else if (filter === 'other') {
    activityTypes = activityTypesFilters.other
  } else if (filter === 'cleared') {
    activityTypes = activityTypesFilters.cleared
  }

  const isCleared = filter === 'cleared'

  const {
    data: { messages = [], projectNames = [] } = {},
    isFetching: isFetchingInbox,
    refetch,
  } = useGetInboxQuery({
    last: last,
    activityTypes: activityTypes,
    isCleared: isCleared,
    userName: userName,
  })

  // prefetch all the other filters in the background
  usePrefetchFilters({ filter, filters: activityTypesFilters, userName, isCleared, last })

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

  const handleMessageSelect = (id, ids = []) => {
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
    const unReadMessages = group.filter((m) => !m.isRead)
    const idsToMarkAsRead = unReadMessages.map((m) => m.activityId)

    const idsToHighlight = idsToMarkAsRead.length > 0 ? idsToMarkAsRead : ids

    if (message.activityType === 'comment') {
      // highlight the activity in the feed
      dispatch(highlightActivity({ isSlideOut: false, activityIds: idsToHighlight }))
    }

    if (idsToMarkAsRead.length > 0) {
      // TODO: update the messages in the backend to mark them as read
      // but for now just patch getInbox cache
      dispatch(
        ayonApi.util.updateQueryData('getInbox', { last, isCleared, activityTypes }, (draft) => {
          for (const id of idsToMarkAsRead) {
            const messageIndex = draft.messages.findIndex((m) => m.activityId === id)
            if (messageIndex !== -1) {
              draft.messages[messageIndex] = { ...draft.messages[messageIndex], isRead: true }
            }
          }
        }),
      )
    }
  }

  const clearMessages = (id, messagesToClear = []) => {
    const idsToClear = messagesToClear.map((m) => m.activityId)

    if (selected.length) {
      // select next message in the list
      const selectedMessageIndex = messages.findIndex((m) => m.activityId === id)
      const nextMessage = messages[selectedMessageIndex + 1]
      if (nextMessage) handleMessageSelect(nextMessage.activityId)
      else setSelected([])
    } else setSelected([])

    // update the messages in the backend to toggle isCleared
    // but for now just patch the caches
    // we need to move the messages from 'important' or 'other' to 'cleared' cache (or the other way around)
    dispatch(
      ayonApi.util.updateQueryData('getInbox', { last, isCleared, activityTypes }, (draft) => {
        // filter out the messages to clear
        draft.messages = draft.messages.filter((m) => !idsToClear.includes(m.activityId))
      }),
    )

    // add to cleared cache or add back to important
    const addingToActivityTypes = isCleared
      ? activityTypesFilters.important
      : activityTypesFilters.cleared

    dispatch(
      ayonApi.util.updateQueryData(
        'getInbox',
        { last, isCleared: !isCleared, activityTypes: addingToActivityTypes },
        (draft) => {
          // add the cleared messages to the start of the messages array
          const clearedMessages = messagesToClear.map((m) => ({
            ...m,
            isCleared: true,
            isRead: true,
          }))
          draft.messages = clearedMessages.concat(draft.messages)
        },
      ),
    )
  }

  const handleClearMessage = (id) => {
    // find the group message with id
    const group = groupedMessages.find((g) => g.activityId === id)
    if (!group) return

    clearMessages(id, group.messages)
  }

  const [handleKeyDown, [usingKeyboard, setUsingKeyboard]] = useKeydown({
    messages: groupedMessages,
    onChange: handleMessageSelect,
    selected,
    listRef,
  })

  // we keep track of the ids that have been pre-fetched to avoid fetching them again
  const handlePrefetch = usePrefetchEntity(dispatch, projectsInfo, 300)

  const handleHover = (message) => {
    const { entityId, projectName, entityType } = message
    if (!entityId || !projectName) return
    handlePrefetch({ id: entityId, projectName, entityType })
  }

  const messagesData = isFetchingInbox || isFetchingInfo ? placeholderMessages : groupedMessages

  const handleClearShortcut = (e) => {
    // get the message list item
    const target = e.target.closest('.isClearable')
    if (!target) return
    // check target has id 'message-{id}` and extract the id
    const [type, id] = target.id.split('-')
    if (type !== 'message' || !id) return

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

  const shortcuts = useMemo(
    () => [
      {
        key: 'c',
        action: handleClearShortcut,
        closest: '.isClearable',
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
              isRead={group.isRead || group.isCleared}
              onSelect={handleMessageSelect}
              isSelected={selected.includes(group.activityId)}
              disableHover={usingKeyboard}
              onClear={
                !selected.length || selected.includes(group.activityId)
                  ? () => handleClearMessage(group.activityId)
                  : undefined
              }
              clearLabel={isCleared ? 'Unclear' : 'Clear'}
              id={group.activityId}
              ids={group.groupIds}
              messages={group.messages}
              changes={group.changes}
              isPlaceholder={group.isPlaceholder}
              onMouseOver={() => handleHover(group)}
              projectsInfo={projectsInfo}
              isMultiple={group.isMultiple}
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
