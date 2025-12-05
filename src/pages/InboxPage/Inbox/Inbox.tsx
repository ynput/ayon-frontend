import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useEffect, useMemo, useRef, useState, MouseEvent, KeyboardEvent } from 'react'
import clsx from 'clsx'
import InboxDetailsPanel from '../InboxDetailsPanel'
import { useDispatch } from 'react-redux'
import Shortcuts from '@containers/Shortcuts'
import { InView } from 'react-intersection-observer'
import { toast } from 'react-toastify'
import { compareAsc } from 'date-fns'
// Queries
import { useGetInboxMessagesQuery, useLazyGetInboxMessagesQuery } from '@queries/inbox/getInbox'
import { useGetProjectsInfoQuery } from '@shared/api'
// Components
import { Button, Spacer } from '@ynput/ayon-react-components'
import { SplitterPanel } from 'primereact/splitter'
import EnableNotifications from '@components/EnableNotifications'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
// Hooks
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import useGroupMessages from '../hooks/useGroupMessages'
import useKeydown from '../hooks/useKeydown'
import useUpdateInboxMessage from '../hooks/useUpdateInboxMessage'
import useInboxRefresh from '../hooks/useInboxRefresh'
import { useListProjectsQuery } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import { useAppSelector } from '@state/store'
// Types
import type {
  InboxFilter,
  InboxFilterArgs,
  GroupedMessage,
  PlaceholderMessage,
  InboxContextMenuItem,
} from '../types'
import type { InboxMessage as InboxMessageType } from '@/services/inbox/inboxTransform'

const placeholderMessages: PlaceholderMessage[] = Array.from({ length: 100 }, (_, i) => ({
  activityId: `placeholder-${i}`,
  folderName: 'Loading...',
  thumbnail: { icon: 'folder' },
  read: false,
  isPlaceholder: true,
}))

const filters: Record<InboxFilter, InboxFilterArgs> = {
  important: { active: true, important: true },
  other: { active: true, important: false },
  cleared: { active: false, important: null },
}

interface InboxProps {
  filter: InboxFilter
}

const Inbox = ({ filter }: InboxProps) => {
  const dispatch = useDispatch()
  const { setHighlightedActivities } = useDetailsPanelContext()

  // get all project names
  const { data: projects = [] } = useListProjectsQuery({})

  const user = useAppSelector((state) => state.user.name)

  const last = 100
  const filterArgs = filters[filter] || filters.important
  const isActive = filterArgs.active
  const isImportant = filterArgs.important

  const {
    data: { messages = [], projectNames = [], pageInfo } = {},
    isLoading: isLoadingInbox,
    isFetching: isFetchingInbox,
    error: errorInbox,
    refetch,
  } = useGetInboxMessagesQuery({
    last: last,
    active: isActive,
    important: isImportant,
  })

  const { hasPreviousPage, endCursor: lastCursor } = pageInfo || {}

  const [getInboxMessages] = useLazyGetInboxMessagesQuery()
  // load more messages
  const handleLoadMore = () => {
    if (!hasPreviousPage || isFetchingInbox || !messages.length) return

    console.log('loading more messages...')

    getInboxMessages({ last, active: isActive, important: isImportant, cursor: lastCursor })
  }

  const { data: projectsInfo = {}, isLoading: isLoadingInfo } = useGetProjectsInfoQuery(
    { projects: projectNames },
    { skip: isLoadingInbox || !projectNames?.length },
  )

  const handleUpdateMessages = useUpdateInboxMessage({
    last,
    isActive,
    isImportant: isImportant ?? false,
  })

  //   now sort the messages by createdAt using the compare function
  const messagesSortedByDate = useMemo(
    () =>
      [...messages].sort((a, b) =>
        isActive ? compareAsc(new Date(b.createdAt), new Date(a.createdAt)) : 0,
      ),
    [messages, isActive],
  )

  // group messages of same entity and type together
  const groupedMessages = useGroupMessages({ messages: messagesSortedByDate, currentUser: user })

  // single select only allow but multi select is possible
  // it always seems to become multi select so i'll just support it from the start
  const [selected, setSelected] = useState<string[]>([])

  const listRef = useRef<HTMLUListElement>(null)

  // when tab changes, focus the first message and clear selected
  // we do this so that keyboard navigation works right away
  useEffect(() => {
    setSelected([])
    if (!listRef.current || isLoadingInbox) return

    const firstChild = listRef.current?.firstElementChild as HTMLElement | null
    firstChild?.focus()
  }, [listRef, isLoadingInbox, filter])

  const handleToggleReadMessage = (id: string): void => {
    // get all the messages in the group
    const group = groupedMessages.find((m) => m.activityId === id)
    // if no group is found, return
    if (!group) return
    // are all the messages in the group read?
    const allRead = group.messages.every((m) => m.read)
    // get all the reference ids of the messages
    const referenceIds = group.messages.map((m) => m.referenceId)

    // update the messages
    handleUpdateMessages(
      referenceIds,
      allRead ? 'unread' : 'read',
      group.projectName,
      false,
      allRead,
    )
  }

  const handleMessageSelect = async (id: string, ids: string[] = []): Promise<void> => {
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
      setHighlightedActivities(idsToHighlight)
    } else {
      setHighlightedActivities([])
    }

    const idsToMarkAsRead = unReadMessages.map((m) => m.referenceId)
    if (idsToMarkAsRead.length > 0 && message) {
      handleUpdateMessages(idsToMarkAsRead, 'read', message.projectName, false, false)
    }
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

  const clearMessages = async (
    id: string | null,
    messagesToClear: InboxMessageType[] = [],
    projectName: string,
    allMessages?: boolean,
  ): Promise<void> => {
    if (selected.length) {
      // select next message in the list
      const selectedMessageIndex = groupedMessages.findIndex((m) => m.activityId === id)
      const nextMessage = groupedMessages[selectedMessageIndex + 1]
      if (nextMessage) handleMessageSelect(nextMessage.activityId)
      else setSelected([])
    } else setSelected([])

    const idsToClear = allMessages ? [] : messagesToClear.map((m) => m.referenceId)
    const isRead = messagesToClear.every((m) => m.read)
    const status = isActive ? 'inactive' : 'unread'

    handleUpdateMessages(idsToClear, status, projectName, true, isRead, allMessages)
  }

  const handleClearMessage = (id: string): void => {
    // find the group message with id
    const group = groupedMessages.find((g) => g.activityId === id)
    if (!group) return

    clearMessages(id, group.messages, group.projectName)
  }

  const handleClearAll = async (): Promise<void> => {
    let promises = []
    // for all projects, clear all messages
    for (const project of projects) {
      const promise = clearMessages(null, [], project.name, true)
      promises.push(promise)
    }

    try {
      await Promise.all(promises)
      toast.success('All messages cleared')
    } catch (error) {
      console.error(error)
    }
  }

  const isLoadingAny = isLoadingInbox || isLoadingInfo || isRefreshing

  // Cast placeholder messages to satisfy GroupedMessage shape for rendering
  const messagesData = isLoadingAny
    ? (placeholderMessages as unknown as GroupedMessage[])
    : groupedMessages

  const getHoveredMessageId = (e: MouseEvent | KeyboardEvent, closest = ''): string | null => {
    // get the message list item
    const target = (e.target as HTMLElement).closest('.inbox-message' + closest)
    if (!target) return null
    // check target has id 'message-{id}` and extract the id
    const [type, id] = target.id.split('-')
    if (type !== 'message' || !id) return null

    return id
  }

  const handleReadShortcut = (e: MouseEvent | KeyboardEvent): void => {
    const id = getHoveredMessageId(e)
    if (!id) return

    handleToggleReadMessage(id)
  }

  const handleClearShortcut = (e: MouseEvent | KeyboardEvent): void => {
    const id = getHoveredMessageId(e, '.clearable')
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

  const contextMenu = (id: string): InboxContextMenuItem[] => {
    // find the group message with id
    const group = groupedMessages.find((g) => g.activityId === id)

    if (!group) return []
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
          handleUpdateMessages(
            referenceIds,
            isRead ? 'unread' : 'read',
            group.projectName,
            false,
            isRead,
          ),
      },
    ]
  }

  const [ctxMenuShow] = useCreateContextMenu([])

  const handleContextMenu = (e: MouseEvent<HTMLLIElement>): void => {
    // get id from the target
    const target = (e.target as HTMLElement).closest('li')
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
    [handleClearShortcut, handleClearAll, handleReadShortcut, isActive, refreshInbox],
  )

  return (
    <>
      {/* @ts-expect-error - Shortcuts component has complex typing */}
      <Shortcuts shortcuts={shortcuts} deps={[messagesData, selected]} />
      <Styled.Tools>
        {/* <InputText placeholder="Search..." /> */}
        <Spacer />
        <EnableNotifications />
        {isActive && (
          <Button
            icon="done_all"
            onClick={handleClearAll}
            disabled={!messages.length}
            shortcut={{ children: getPlatformShortcutKey('c', [KeyMode.Shift]) }}
          >
            Clear all
          </Button>
        )}
        <Button icon="refresh" onClick={refreshInbox} shortcut={{ children: 'R' }}>
          Refresh
        </Button>
      </Styled.Tools>
      <Styled.InboxSection direction="row">
        <DetailsPanelSplitter
          layout="horizontal"
          style={{ width: '100%', height: '100%' }}
          stateKey="inbox-splitter"
        >
          <SplitterPanel size={60} style={{ minWidth: 300, overflow: 'hidden' }}>
            <Styled.MessagesList
              ref={listRef}
              onMouseMove={() => setUsingKeyboard(false)}
              onKeyDown={handleKeyDown}
              className={clsx({ isLoading: isLoadingInbox })}
            >
              {messagesData.map((group) => (
                <InboxMessage
                  key={group.activityId}
                  path={group.path}
                  type={group.activityType}
                  entityType={group.entityType ?? undefined}
                  entityId={group.entityId ?? undefined}
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
                  customBody={group.body}
                />
              ))}
              {hasPreviousPage && !isLoadingInbox && !!messages.length && (
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
            {!isLoadingAny && (errorInbox || !messagesData.length) && (
              <EmptyPlaceholder
                icon="done_all"
                message="All caught up! No messages to show."
                error={errorInbox}
              />
            )}
          </SplitterPanel>
          <SplitterPanel
            size={40}
            style={{ minWidth: 300, overflow: 'hidden' }}
            className="details"
          >
            <InboxDetailsPanel
              messages={messagesData}
              selected={selected}
              projectsInfo={projectsInfo}
              onClose={() => setSelected([])}
            />
          </SplitterPanel>
        </DetailsPanelSplitter>
      </Styled.InboxSection>
    </>
  )
}

export default Inbox
