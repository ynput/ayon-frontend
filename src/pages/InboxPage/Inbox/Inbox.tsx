import InboxMessage from '../InboxMessage/InboxMessage'
import * as Styled from './Inbox.styled'
import { useCallback, useEffect, useMemo, useRef, useState, MouseEvent, KeyboardEvent } from 'react'
import clsx from 'clsx'
import InboxDetailsPanel from '../InboxDetailsPanel'
import { useDispatch } from 'react-redux'
import Shortcuts from '@containers/Shortcuts'
import { InView } from 'react-intersection-observer'
import { toast } from 'react-toastify'
import { compareAsc } from 'date-fns'
// Queries
import { useGetInboxMessagesQuery, useLazyGetInboxMessagesQuery } from '@queries/inbox/getInbox'
import { useGetProjectInboxInfiniteInfiniteQuery } from '@queries/inbox/getProjectInbox'
import { useGetProjectsInfoQuery } from '@shared/api'
import type { QueryFilter } from '@shared/api'
// Components
import { Button } from '@ynput/ayon-react-components'
import { SplitterPanel } from 'primereact/splitter'
import EnableNotifications from '@components/EnableNotifications'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import ProjectsList from '@containers/ProjectsList/ProjectsList'
import type { Hidden } from '@containers/ProjectsList/hooks/useProjectsListMenuItems'
import { parseProjectFolderRowId } from '@containers/ProjectsList/buildProjectsTableData'
import InboxSearchFilter from '../components/InboxSearchFilter'
// Hooks
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import useGroupMessages from '../hooks/useGroupMessages'
import useKeydown from '../hooks/useKeydown'
import useUpdateInboxMessage from '../hooks/useUpdateInboxMessage'
import useInboxRefresh from '../hooks/useInboxRefresh'
import useInboxProject from '../hooks/useInboxProject'
import {
  buildInboxFilter,
  getInboxActivityTypes,
  getInboxReferenceTypes,
} from '../util/inboxFilter'
import { useDetailsPanelContext, useGlobalContext } from '@shared/context'
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
  SelectModifiers,
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

// the panel is a picker here, so every project/folder management action is hidden
const HIDDEN_PROJECT_ACTIONS: Hidden = {
  'add-project': true,
  'archive-project': true,
  'delete-project': true,
  'move-project': true,
  'create-folder': true,
  'rename-folder': true,
  'edit-folder': true,
  'delete-folder': true,
  'edit-label': true,
}

interface InboxProps {
  filter: InboxFilter
}

const Inbox = ({ filter }: InboxProps) => {
  const dispatch = useDispatch()
  const { setHighlightedActivities } = useDetailsPanelContext()
  const {
    projects: { all: projects },
    isLoading: globalIsLoading,
  } = useGlobalContext()

  // get all project names
  const user = useAppSelector((state) => state.user.name)
  const isGuest = useAppSelector((state) => state.user?.data?.isGuest)

  const last = 100
  const filterArgs = filters[filter] || filters.important
  const isActive = filterArgs.active
  const isImportant = filterArgs.important

  // filtering is only possible per project - the inbox resolver takes no filter args
  // guests get no project mode: the activities resolver rejects projects they cannot access
  const [selectedProject, setSelectedProject] = useInboxProject(!isGuest)
  const [inboxFilter, setInboxFilter] = useState<QueryFilter>({ operator: 'and', conditions: [] })
  // the only filter that works without a project, so it is a toolbar toggle, not a chip
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const isProjectMode = !!selectedProject

  const projectArgs = useMemo(
    () => ({
      projectName: selectedProject as string,
      userName: user,
      referenceTypes: getInboxReferenceTypes(inboxFilter, isImportant),
      activityTypes: getInboxActivityTypes(inboxFilter),
      filter: buildInboxFilter({
        userName: user,
        isActive,
        isImportant,
        isUnread: isActive && showUnreadOnly,
        uiFilter: inboxFilter,
      }),
      active: isActive,
      important: isImportant,
    }),
    [selectedProject, user, inboxFilter, isActive, isImportant, showUnreadOnly],
  )

  // a stale url/storage value (renamed project, or a folder row id) would 404 the query,
  // so the project query waits until the name is known to exist
  const isKnownProject = !!selectedProject && projects.some((p) => p.name === selectedProject)

  useEffect(() => {
    if (!selectedProject || globalIsLoading.projects) return
    if (!isKnownProject) setSelectedProject(null)
  }, [selectedProject, isKnownProject, globalIsLoading.projects, setSelectedProject])

  // null, not false: false would ask the resolver for read messages only
  const unreadArg = isActive && showUnreadOnly ? true : null

  const globalQuery = useGetInboxMessagesQuery(
    { last: last, active: isActive, important: isImportant, unread: unreadArg },
    { skip: isProjectMode },
  )
  const projectQuery = useGetProjectInboxInfiniteInfiniteQuery(projectArgs, {
    skip: !isKnownProject,
  })

  const activeQuery = isProjectMode ? projectQuery : globalQuery

  const {
    isLoading: isLoadingInbox,
    isFetching: isFetchingInbox,
    error: errorInbox,
    refetch,
  } = activeQuery

  const { hasNextPage, fetchNextPage, isFetchingNextPage } = projectQuery

  const projectMessages = useMemo(
    () => (projectQuery.data?.pages || []).flatMap((page) => page.messages),
    [projectQuery.data],
  )

  const { messages: globalMessages = [], projectNames = [], pageInfo } = globalQuery.data || {}
  const messages = isProjectMode ? projectMessages : globalMessages
  const hasMore = isProjectMode ? !!hasNextPage : !!pageInfo?.hasPreviousPage

  const [getInboxMessages] = useLazyGetInboxMessagesQuery()

  // pagination merges into the same cache entry, so it must not blank the list the way
  // a project/tab/filter change does
  const [isPaginatingGlobal, setIsPaginatingGlobal] = useState(false)
  useEffect(() => {
    if (!isFetchingInbox && isPaginatingGlobal) setIsPaginatingGlobal(false)
  }, [isFetchingInbox, isPaginatingGlobal])

  const isPaginating = isProjectMode ? isFetchingNextPage : isPaginatingGlobal

  // load more messages
  const handleLoadMore = () => {
    if (!hasMore || !messages.length) return

    if (isProjectMode) {
      if (isFetchingNextPage) return
      fetchNextPage()
      return
    }

    if (isFetchingInbox) return

    setIsPaginatingGlobal(true)
    getInboxMessages({
      last,
      active: isActive,
      important: isImportant,
      unread: unreadArg,
      cursor: pageInfo?.endCursor,
    })
  }

  // in project mode the info is needed even when the filtered list comes back empty
  const infoProjectNames = isProjectMode ? [selectedProject as string] : projectNames

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: infoProjectNames },
    { skip: isLoadingInbox || !infoProjectNames?.length },
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
        isActive ? compareAsc(new Date(b.createdAt as string), new Date(a.createdAt as string)) : 0,
      ),
    [messages, isActive],
  )

  // group messages of same entity and type together
  const groupedMessages = useGroupMessages({ messages: messagesSortedByDate, currentUser: user })

  const [selected, setSelected] = useState<string[]>([])
  const lastSelectedIndexRef = useRef<number>(-1)

  const listRef = useRef<HTMLUListElement>(null)

  // when tab changes, focus the first message and clear selected
  // we do this so that keyboard navigation works right away
  useEffect(() => {
    setSelected([])
    // reset the shift-range anchor so it can't point at a stale row in the new list
    lastSelectedIndexRef.current = -1
    if (!listRef.current || isLoadingInbox) return

    const firstChild = listRef.current?.firstElementChild as HTMLElement | null
    firstChild?.focus()
  }, [listRef, isLoadingInbox, filter, selectedProject])

  const handleProjectSelect = useCallback(
    (ids: string[]): void => {
      // clicking the selected row clears it, which returns to the cross-project inbox
      if (!ids.length) return setSelectedProject(null)
      // folder rows are group headers, their ids are not project names
      const projectName = ids.find((id) => !parseProjectFolderRowId(id))
      if (projectName) setSelectedProject(projectName)
    },
    [setSelectedProject],
  )

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

  const handleMessageSelect = (
    id: string,
    ids: string[] = [],
    modifiers?: SelectModifiers,
    rowIndex?: number,
  ): void => {
    if (id.includes('placeholder')) return

    // mouse/keyboard pass rowIndex; programmatic calls resolve it from the list
    const currentIndex =
      rowIndex !== undefined ? rowIndex : groupedMessages.findIndex((m) => m.activityId === id)

    let newSelection: string[]
    if (modifiers?.shiftKey && lastSelectedIndexRef.current >= 0) {
      const start = Math.min(lastSelectedIndexRef.current, currentIndex)
      const end = Math.max(lastSelectedIndexRef.current, currentIndex)
      newSelection = groupedMessages.slice(start, end + 1).map((m) => m.activityId)
    } else if (modifiers?.metaKey || modifiers?.ctrlKey) {
      newSelection = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
      lastSelectedIndexRef.current = currentIndex
    } else {
      newSelection = selected.includes(id) ? [] : [id]
      lastSelectedIndexRef.current = currentIndex
    }

    setSelected(newSelection)

    if (newSelection.length !== 1) {
      setHighlightedActivities([])
      return
    }

    const message = groupedMessages.find((m) => m.activityId === newSelection[0])
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

  const getSelectedGroups = (): GroupedMessage[] =>
    selected
      .map((sid) => groupedMessages.find((g) => g.activityId === sid))
      .filter((g): g is GroupedMessage => Boolean(g))

  // handleUpdateMessages is per-project, so bulk actions must group referenceIds by project
  const groupReferenceIdsByProject = (
    groups: GroupedMessage[],
  ): Record<string, { ids: string[]; reads: boolean[] }> => {
    const byProject: Record<string, { ids: string[]; reads: boolean[] }> = {}
    for (const group of groups) {
      if (!byProject[group.projectName]) byProject[group.projectName] = { ids: [], reads: [] }
      for (const m of group.messages) {
        byProject[group.projectName].ids.push(m.referenceId)
        byProject[group.projectName].reads.push(m.read)
      }
    }
    return byProject
  }

  const clearSelected = (): void => {
    const groups = getSelectedGroups()
    if (!groups.length) return

    const status = isActive ? 'inactive' : 'unread'
    const byProject = groupReferenceIdsByProject(groups)
    Object.entries(byProject).forEach(([projectName, { ids, reads }]) => {
      const isRead = reads.every(Boolean)
      handleUpdateMessages(ids, status, projectName, true, isRead)
    })
    setSelected([])
    lastSelectedIndexRef.current = -1
  }

  const toggleReadSelected = (): void => {
    const groups = getSelectedGroups()
    if (!groups.length) return

    const allRead = groups.every((g) => g.read)
    const byProject = groupReferenceIdsByProject(groups)
    Object.entries(byProject).forEach(([projectName, { ids }]) => {
      handleUpdateMessages(ids, allRead ? 'unread' : 'read', projectName, false, allRead)
    })
  }

  const handleClearAll = async (): Promise<void> => {
    let promises = []
    // clear every project, or only the selected one when filtering by project
    const projectsToClear = isProjectMode
      ? [selectedProject as string]
      : projects.map((p) => p.name)
    for (const project of projectsToClear) {
      const promise = clearMessages(null, [], project, true)
      promises.push(promise)
    }

    try {
      await Promise.all(promises)
      toast.success('All messages cleared')
    } catch (error) {
      console.error(error)
    }
  }

  // project info only feeds status colours, and it reloads on every project switch -
  // gating the list on it flashes the placeholders a second time.
  // Keyed on isFetching: RTK Query keeps the previous project's data while the new query
  // runs, so isLoading, isSuccess and data all still describe the old project for ~500ms.
  const isLoadingAny = (isFetchingInbox && !isPaginating) || isRefreshing

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
    if (selected.length > 1) {
      toggleReadSelected()
      return
    }

    const id = getHoveredMessageId(e)
    if (!id) return

    handleToggleReadMessage(id)
  }

  const handleClearShortcut = (e: MouseEvent | KeyboardEvent): void => {
    if (selected.length > 1) {
      clearSelected()
      return
    }

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

  const contextMenu = (id: string, isMulti = false): InboxContextMenuItem[] => {
    if (isMulti) {
      const groups = getSelectedGroups()
      const allRead = groups.every((g) => g.read)
      return [
        {
          id: 'clear',
          label: `${isActive ? 'Clear' : 'Unclear'} ${selected.length}`,
          icon: isActive ? 'done' : 'replay',
          shortcut: 'c',
          command: clearSelected,
        },
        {
          id: allRead ? 'unread' : 'read',
          label: allRead ? 'Mark as unread' : 'Mark as read',
          icon: allRead ? 'mark_email_unread' : 'drafts',
          disabled: !isActive,
          shortcut: 'x',
          command: toggleReadSelected,
        },
      ]
    }

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

    // keep the multi-selection when right-clicking a row that is part of it
    const isMulti = selected.length > 1 && selected.includes(id)
    if (!isMulti) {
      setSelected([id])
      // move the shift-range anchor to the right-clicked row so a following shift-select is correct
      lastSelectedIndexRef.current = groupedMessages.findIndex((m) => m.activityId === id)
    }

    // open context menu
    ctxMenuShow(e, contextMenu(id, isMulti))
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
      <Styled.InboxSection direction="row">
        <Styled.ProjectsSplitter
          stateKey="inbox-projects-splitter"
          stateStorage="local"
          style={{ width: '100%', height: '100%' }}
          className={clsx({ 'no-projects': isGuest })}
        >
          <SplitterPanel size={18} style={{ minWidth: 180 }}>
            <ProjectsList
              selection={selectedProject ? [selectedProject] : []}
              onSelect={handleProjectSelect}
              allowEmptySelection
              hidden={HIDDEN_PROJECT_ACTIONS}
            />
          </SplitterPanel>
          <SplitterPanel size={82} style={{ overflow: 'hidden' }}>
            <Styled.MessagesColumn>
              <Styled.Tools>
                <InboxSearchFilter
                  filter={inboxFilter}
                  onChange={setInboxFilter}
                  projectName={selectedProject}
                  isImportant={isImportant}
                  isLoading={isLoadingInbox}
                />
                {/* clearing a message also marks it read, so unread is meaningless on the cleared tab */}
                {isActive && (
                  <Button
                    icon={showUnreadOnly ? 'mark_email_unread' : 'drafts'}
                    selected={showUnreadOnly}
                    onClick={() => setShowUnreadOnly((prev) => !prev)}
                  >
                    Unread only
                  </Button>
                )}
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
              <DetailsPanelSplitter
                layout="horizontal"
                style={{ width: '100%' }}
                stateKey="inbox-splitter"
              >
                <SplitterPanel size={60} style={{ minWidth: 300, overflow: 'hidden' }}>
                  <Styled.MessagesList
                    ref={listRef}
                    onMouseMove={() => setUsingKeyboard(false)}
                    onKeyDown={handleKeyDown}
                    className={clsx({ isLoading: isLoadingInbox })}
                  >
                    {messagesData.map((group, i: number) => (
                      <InboxMessage
                        key={group.activityId}
                        rowIndex={i}
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
                    {hasMore && !isLoadingInbox && !!messages.length && (
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
                  style={{ minWidth: 300, overflow: 'visible' }}
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
            </Styled.MessagesColumn>
          </SplitterPanel>
        </Styled.ProjectsSplitter>
      </Styled.InboxSection>
    </>
  )
}

export default Inbox
