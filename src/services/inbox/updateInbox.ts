import { toast } from 'react-toastify'
import { inboxApi, ManageInboxItemApiArg } from '@shared/api'
import { current } from '@reduxjs/toolkit'
import { enhancedInboxGraphql } from './getInbox'
import { projectInboxApi, type GetProjectInboxArgs } from './getProjectInbox'

// add some extra types for the patching
export interface Arg extends ManageInboxItemApiArg {
  active: boolean
  important: boolean
  last: number
  isActiveChange: boolean
  isRead: boolean
}

// When reading a message, we need to update the unread count
const patchUnreadCount = (dispatch: any, count: number | 'all', important: boolean) => {
  dispatch(
    enhancedInboxGraphql.util.updateQueryData('GetInboxUnreadCount', { important }, (draft) => {
      // console.log('updating unread count: ', draft - count, count)
      return count === 'all' ? 0 : Math.max(0, draft - count)
    }),
  )
}

const cacheArgsFor = (state: any, endpointName: string, matches: (args: any) => boolean): any[] =>
  Object.values(state?.restApi?.queries || {})
    .filter((entry: any) => entry?.endpointName === endpointName && matches(entry?.originalArgs))
    .map((entry: any) => entry.originalArgs)

// The project inbox is cached per filter combination, so the entries to patch can
// only be found by walking the cache and matching on the project.
const getProjectInboxArgs = (state: any, projectName?: string): GetProjectInboxArgs[] =>
  projectName
    ? cacheArgsFor(state, 'getProjectInbox', (args) => args?.projectName === projectName)
    : []

// The cross-project inbox is keyed by unread as well, so a hardcoded arg triple
// no longer finds the live entry - match on the tab instead.
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

        let messages: any[] = []

        let tagsToInvalidate = [{ type: 'inbox', id: 'hasUnread' }]

        const patches: { undo: () => void }[] = []

        const projectArgs = getProjectInboxArgs(getState(), projectName)
        const patchProjectInbox = (
          args: GetProjectInboxArgs,
          recipe: (draft: { messages: any[] }) => void,
        ) => {
          patches.push(
            dispatch(projectInboxApi.util.updateQueryData('getProjectInbox', args, recipe as any)),
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

          //   the cache to remove from (current tab)
          patchInbox({ active, important }, (draft) => {
            if (all) {
              // add all messages to the messages array (for later)
              messages = draft.messages.map((m) => current(m))
              // remove all messages
              draft.messages = []
            } else {
              // find the messages to clear and add them to the messages array (for later)
              messages = draft.messages
                .filter((m) => ids.includes(m.referenceId))
                .map((m) => current(m))
              // filter out the messages to clear
              draft.messages = draft.messages.filter((m) => !ids.includes(m.referenceId))
            }
          })

          //  now where do we add the cleared message
          if (active) {
            // when clearing a message
            // it will always go to the cleared tab (active=false) (important=null)
            const messagesPatch = messages.map((m) => ({ ...m, active: false, read: true }))

            //   the cache to add to (cleared/important/other tab)
            patchInbox({ active: !active, important: null }, (draft) => {
              // adding message to the new cache
              console.log('adding message to new cache location')
              draft.messages.unshift(...messagesPatch)
            })
          } else {
            // un-clearing a message
            // remove the message from the cleared tab cache
            patchInbox({ active: false, important: null }, (draft) => {
              // remove the messages from cleared cache
              draft.messages = draft.messages.filter((m) => !ids.includes(m.referenceId))
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

          // project mode: drop the rows from the tab they are leaving. The tab they land
          // in is cached per filter, so invalidate it instead of guessing which entry fits.
          projectArgs
            .filter((args) => args.active === active)
            .forEach((args) =>
              patchProjectInbox(args, (draft) => {
                draft.messages = all
                  ? []
                  : draft.messages.filter((m: any) => !ids.includes(m.referenceId))
              }),
            )
          if (projectName) {
            tagsToInvalidate.push({ type: 'inbox', id: `project=${projectName}/active=${!active}` })
          }
        } else {
          // only updating the read status of the message
          // patch new data into the cache. Rows are not removed from an unread-filtered
          // list here: the row the user just clicked would vanish under the cursor.
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
            }),
          )
        }

        // we need to update the unread count
        if (status === 'unread' && !isActiveChange) {
          // a message being marked as unread (in other or important)
          // so increase the unread count
          patchUnreadCount(dispatch, -ids.length, important)
        } else if ((status === 'read' || status === 'inactive') && !isRead) {
          // invalidating the unread count
          patchUnreadCount(dispatch, ids.length, important)
        }

        // we are clearing all messages so remove read count from important
        if (all) {
          patchUnreadCount(dispatch, 'all', true)
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
