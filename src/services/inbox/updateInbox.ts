import { toast } from 'react-toastify'
import { inboxApi, ManageInboxItemApiArg } from '@shared/api'
import { current } from '@reduxjs/toolkit'
import { enhancedInboxGraphql } from './getInbox'
import { projectInboxApi, type ProjectInboxInfiniteArgs } from './getProjectInbox'

// add some extra types for the patching
export interface Arg extends ManageInboxItemApiArg {
  active: boolean
  important: boolean
  last: number
  isActiveChange: boolean
  isRead: boolean
}

// When reading a message, we need to update the unread count
const patchUnreadCount = (dispatch: any, count: number, important: boolean) => {
  dispatch(
    enhancedInboxGraphql.util.updateQueryData('GetInboxUnreadCount', { important }, (draft) =>
      Math.max(0, draft - count),
    ),
  )
}

const cacheArgsFor = (state: any, endpointName: string, matches: (args: any) => boolean): any[] =>
  Object.values(state?.[inboxApi.reducerPath]?.queries || {})
    .filter((entry: any) => entry?.endpointName === endpointName && matches(entry?.originalArgs))
    .map((entry: any) => entry.originalArgs)

// both inboxes are cached per filter combination, so the entries to patch can only be
// found by walking the cache - a hardcoded arg set no longer finds the live entry
const getProjectInboxArgs = (state: any, projectName?: string): ProjectInboxInfiniteArgs[] =>
  projectName
    ? cacheArgsFor(state, 'getProjectInboxInfinite', (args) => args?.projectName === projectName)
    : []

const getInboxArgs = (state: any, active?: boolean, important?: boolean | null): any[] =>
  cacheArgsFor(
    state,
    'GetInboxMessages',
    (args) => args?.active === active && args?.important === important,
  )

const enhancedRest = inboxApi.enhanceEndpoints({
  endpoints: {
    manageInboxItem: {
      async onQueryStarted(
        {
          active,
          important,
          isActiveChange,
          isRead,
          manageInboxItemRequest: { ids = [], status, all, projectName },
        }: Arg,
        { dispatch, getState, queryFulfilled },
      ) {
        let newRead, newActive

        switch (status) {
          case 'read':
            newRead = true
            newActive = true
            break
          case 'unread':
            newRead = false
            newActive = true
            break
          case 'inactive':
            newActive = false
            newRead = true
            break
        }

        const movedMessages = new Map<string, any>()
        // referenceIds of the unread rows removed from any cache - drives the badge
        const clearedUnread = new Set<string>()

        let tagsToInvalidate = [{ type: 'inbox', id: 'hasUnread' }]

        const patches: { undo: () => void }[] = []

        // `all` is one project on the backend, so the cross-project cache must keep the rest
        const isLeaving = all
          ? (m: any) => m.projectName === projectName
          : (m: any) => ids.includes(m.referenceId)

        const projectArgs = getProjectInboxArgs(getState(), projectName)
        const patchProjectInbox = (
          args: ProjectInboxInfiniteArgs,
          recipe: (draft: { pages: { messages: any[] }[] }) => void,
        ) => {
          patches.push(
            dispatch(
              projectInboxApi.util.updateQueryData('getProjectInboxInfinite', args, recipe as any),
            ),
          )
        }

        // patches every cached variant of a tab (unread on and off)
        const patchInbox = (
          tab: { active?: boolean; important?: boolean | null },
          recipe: (draft: { messages: any[] }) => void,
        ) =>
          getInboxArgs(getState(), tab.active, tab.important).forEach((args) =>
            patches.push(
              dispatch(
                enhancedInboxGraphql.util.updateQueryData('GetInboxMessages', args, recipe as any),
              ),
            ),
          )

        if (isActiveChange) {
          // this means we are changing the active (cleared) status of the message
          // if will be moving from one cache to another

          //   the cache to remove from (current tab). Each cached variant holds a different
          //   subset, so collect the union across them
          patchInbox({ active, important }, (draft) => {
            draft.messages.filter(isLeaving).forEach((m) => {
              movedMessages.set(m.referenceId, current(m))
              if (!m.read) clearedUnread.add(m.referenceId)
            })

            draft.messages = draft.messages.filter((m) => !isLeaving(m))
          })

          //  now where do we add the cleared message
          if (active) {
            // when clearing a message
            // it will always go to the cleared tab (active=false) (important=null)
            const messagesPatch = [...movedMessages.values()].map((m) => ({
              ...m,
              active: false,
              read: true,
            }))

            //   the cache to add to (cleared/important/other tab)
            patchInbox({ active: !active, important: null }, (draft) => {
              // adding message to the new cache
              draft.messages.unshift(...messagesPatch)
            })
          } else {
            // un-clearing a message
            // remove the message from the cleared tab cache
            patchInbox({ active: false, important: null }, (draft) => {
              // remove the messages from cleared cache
              draft.messages = draft.messages.filter((m) => !isLeaving(m))
            })
            // we don't know if the message will go to important or other tab
            // so just invalidate all the tabs and unread counts
            tagsToInvalidate.push(
              ...[
                { type: 'inbox', id: `active=true/important=false` },
                { type: 'inbox', id: `active=true/important=true` },
                { type: 'inbox', id: 'unreadCount' }, //the counters
              ],
            )
          }

          // the tab they land in is cached per filter, so invalidate rather than guess
          projectArgs
            .filter((args) => args.active === active)
            .forEach((args) =>
              patchProjectInbox(args, (draft) => {
                draft.pages.forEach((page) => {
                  page.messages.filter(isLeaving).forEach((m: any) => {
                    if (!m.read) clearedUnread.add(m.referenceId)
                  })
                  page.messages = page.messages.filter((m: any) => !isLeaving(m))
                })
              }),
            )
          if (projectName) {
            tagsToInvalidate.push({ type: 'inbox', id: `project=${projectName}/active=${!active}` })
          }
        } else {
          // only updating the read status of the message
          // not removed from an unread-filtered list: the clicked row would vanish under
          // the cursor
          patchInbox({ active, important }, (draft) => {
            for (const id of ids) {
              const messageIndex = draft.messages.findIndex((m: any) => m.referenceId === id)
              if (messageIndex !== -1) {
                draft.messages[messageIndex] = {
                  ...draft.messages[messageIndex],
                  read: newRead,
                  active: newActive,
                }
              }
            }
          })

          projectArgs.forEach((args) =>
            patchProjectInbox(args, (draft) => {
              for (const page of draft.pages) {
                for (const id of ids) {
                  const messageIndex = page.messages.findIndex((m: any) => m.referenceId === id)
                  if (messageIndex !== -1) {
                    page.messages[messageIndex] = {
                      ...page.messages[messageIndex],
                      read: newRead,
                      active: newActive,
                    }
                  }
                }
              }
            }),
          )
        }

        // we need to update the unread count
        if (isActiveChange && status === 'inactive') {
          // clearing marks the rows read, so only the unread ones move the badge
          if (clearedUnread.size) patchUnreadCount(dispatch, clearedUnread.size, important)
          // `all` clears beyond what the cache held, so the exact figure must come from the server
          if (all) tagsToInvalidate.push({ type: 'inbox', id: 'unreadCount' })
        } else if (status === 'unread' && !isActiveChange) {
          // a message being marked as unread (in other or important)
          // so increase the unread count
          patchUnreadCount(dispatch, -ids.length, important)
        } else if (status === 'read' && !isRead) {
          // invalidating the unread count
          patchUnreadCount(dispatch, ids.length, important)
        }

        try {
          await queryFulfilled

          // invalidate tags AFTER the query is fulfilled and for ALL apis
          if (tagsToInvalidate.length) {
            dispatch(inboxApi.util.invalidateTags(tagsToInvalidate))
            dispatch(inboxApi.util.invalidateTags(tagsToInvalidate))
          }
        } catch (error: any) {
          const message = `Error: ${error?.error?.data?.detail}`
          console.error(message, error)
          toast.error(message)
          patches.forEach((patch) => patch.undo())
        }
      },
    },
  },
})

export const { useManageInboxItemMutation } = enhancedRest
export { enhancedRest as inboxQueries }
