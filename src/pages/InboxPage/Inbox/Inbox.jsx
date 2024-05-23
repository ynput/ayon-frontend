import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useEffect, useMemo, useRef, useState } from 'react'
import useKeydown from '../hooks/useKeydown'
import { classNames } from 'primereact/utils'
import InboxDetailsPanel from '../InboxDetailsPanel'
import { usePrefetchEntity } from '../../UserDashboardPage/util'
import { useDispatch } from 'react-redux'
import { useGetInboxQuery } from '/src/services/inbox/getInbox'
import { useGetProjectsInfoQuery } from '/src/services/userDashboard/getUserDashboard'
import { ayonApi } from '/src/services/ayon'
import Shortcuts from '/src/containers/Shortcuts'

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

  const last = 10

  let activityTypes = []
  if ('important' === filter) {
    activityTypes = activityTypesFilters.important
  } else if (filter === 'other') {
    activityTypes = activityTypesFilters.other
  } else if (filter === 'cleared') {
    activityTypes = activityTypesFilters.cleared
  }

  const isCleared = filter === 'cleared'

  const { data: { messages = [], projectNames = [] } = {}, isFetching: isFetchingInbox } =
    useGetInboxQuery({
      last: last,
      activityTypes: activityTypes,
      isCleared: isCleared,
    })

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: projectNames },
    { skip: isFetchingInbox || !projectNames?.length },
  )

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

  const handleMessageSelect = (id) => {
    if (id.includes('placeholder')) return
    // if the message is already selected, deselect it
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id))
      return
    } else {
      setSelected([id])
    }

    // get messages and check if it has been read
    const message = messages.find((m) => m.activityId === id)
    if (message && !message.isRead) {
      // TODO: update the message in the backend to mark it as read
      // but for now just patch getInbox cache
      dispatch(
        ayonApi.util.updateQueryData('getInbox', { last, isCleared, activityTypes }, (draft) => {
          const messageIndex = draft.messages.findIndex((m) => m.activityId === id)
          if (messageIndex === -1) return
          draft.messages[messageIndex] = { ...draft.messages[messageIndex], isRead: true }
        }),
      )
    }
  }

  const handClearMessage = (id) => {
    console.log('clearing message', id)
    // get messages and check if it has been cleared already
    const messageToClear = messages.find((m) => m.activityId === id)
    if (!messageToClear) return console.error('messageToClear not found')

    if (selected.length) {
      // select next message in the list
      const messageIndex = messages.findIndex((m) => m.activityId === id)
      const nextMessage = messages[messageIndex + 1]
      if (nextMessage) handleMessageSelect(nextMessage.activityId)
      else setSelected([])
    } else setSelected([])

    if (messageToClear && !messageToClear.isCleared) {
      // TODO: update the message in the backend to mark it as cleared
      // but for now just patch the caches
      // we need to move the messages from 'important' or 'other' to 'cleared' cache
      dispatch(
        ayonApi.util.updateQueryData('getInbox', { last, isCleared, activityTypes }, (draft) => {
          const messageIndex = draft.messages.findIndex((m) => m.activityId === id)
          if (messageIndex === -1) return
          // delete message
          draft.messages.splice(messageIndex, 1)
        }),
      )
      // add to cleared cache
      dispatch(
        ayonApi.util.updateQueryData(
          'getInbox',
          { last, isCleared: true, activityTypes: activityTypesFilters.cleared },
          (draft) => {
            draft.messages.unshift({ ...messageToClear, isCleared: true })
          },
        ),
      )
    }
  }

  const [handleKeyDown, [usingKeyboard, setUsingKeyboard]] = useKeydown({
    messages: messages,
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

  const messagesData = isFetchingInbox ? placeholderMessages : messages

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
      if (selected.includes(id)) handClearMessage(id)
    } else {
      // if nothing is selected, clear the target
      handClearMessage(id)
    }
  }

  const shortcuts = useMemo(
    () => [
      {
        key: 'c',
        action: handleClearShortcut,
        closest: '.isClearable',
      },
    ],
    [messagesData, selected],
  )

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[messagesData, selected]} />
      <Styled.InboxSection direction="row">
        <Styled.MessagesList
          ref={listRef}
          onMouseMove={() => setUsingKeyboard(false)}
          onKeyDown={handleKeyDown}
          className={classNames({ isLoading: isFetchingInbox })}
        >
          {messagesData.map((message) => (
            <InboxMessage
              key={message.activityId}
              title={message.folderName}
              subTitle={message.origin?.label || message.origin?.name}
              type={message.activityType}
              body={message.body}
              createdAt={message.createdAt}
              userName={message.author?.name}
              isRead={message.isRead || message.isCleared}
              onSelect={() => handleMessageSelect(message.activityId)}
              isSelected={selected.includes(message.activityId)}
              disableHover={usingKeyboard}
              onClear={
                (!selected.length || selected.includes(message.activityId)) && !message.isCleared
                  ? () => handClearMessage(message.activityId)
                  : undefined
              }
              id={message.activityId}
              isPlaceholder={message.isPlaceholder}
              onMouseOver={() => handleHover(message)}
            />
          ))}
        </Styled.MessagesList>
        <InboxDetailsPanel
          messages={messagesData}
          selected={selected}
          projectsInfo={projectsInfo}
          // onClose={() => setSelected([])}
        />
      </Styled.InboxSection>
    </>
  )
}

export default Inbox
