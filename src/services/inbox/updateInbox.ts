import { toast } from 'react-toastify'
import { api, ManageInboxItemApiArg } from '@shared/api'
import { $Any } from '@types'
import { current } from '@reduxjs/toolkit'
import { enhancedInboxGraphql } from './getInbox'

// add some extra types for the patching
export interface Arg extends ManageInboxItemApiArg {
  active: boolean
  important: boolean
  last: number
  isActiveChange: boolean
  isRead: boolean
}

// When reading a message, we need to update the unread count
const patchUnreadCount = (dispatch: $Any, count: number | 'all', important: boolean) => {
  dispatch(
    enhancedInboxGraphql.util.updateQueryData('GetInboxUnreadCount', { important }, (draft) => {
      // console.log('updating unread count: ', draft - count, count)
      return count === 'all' ? 0 : Math.max(0, draft - count)
    }),
  )
}

const enhancedRest = api.enhanceEndpoints({
  endpoints: {
    manageInboxItem: {
      async onQueryStarted(
        {
          active,
          important,
          last,
          isActiveChange,
          isRead,
          manageInboxItemRequest: { ids = [], status, all },
        }: Arg,
        { dispatch, queryFulfilled },
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

        let patchResult

        let messages: $Any[] = []

        let tagsToInvalidate = [{ type: 'inbox', id: 'hasUnread' }]

        if (isActiveChange) {
          // this means we are changing the active (cleared) status of the message
          // if will be moving from one cache to another

          //   the cache to remove from (current tab)
          dispatch(
            enhancedInboxGraphql.util.updateQueryData(
              'GetInboxMessages',
              { last, important, active },
              (draft) => {
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
              },
            ),
          )

          //  now where do we add the cleared message
          if (active) {
            // when clearing a message
            // it will always go to the cleared tab (active=false) (important=null)
            const messagesPatch = messages.map((m) => ({ ...m, active: false, read: true }))

            //   the cache to add to (cleared/important/other tab)
            dispatch(
              enhancedInboxGraphql.util.updateQueryData(
                'GetInboxMessages',
                { last, important: null, active: !active },
                (draft) => {
                  // adding message to the new cache
                  console.log('adding message to new cache location')
                  draft.messages.unshift(...messagesPatch)
                },
              ),
            )
          } else {
            // un-clearing a message
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
        } else {
          // only updating the read status of the message
          // patch new data into the cache
          patchResult = dispatch(
            enhancedInboxGraphql.util.updateQueryData(
              'GetInboxMessages',
              { last, active, important },
              (draft) => {
                for (const id of ids) {
                  const messageIndex = draft.messages.findIndex((m) => m.referenceId === id)
                  if (messageIndex !== -1) {
                    draft.messages[messageIndex] = {
                      ...draft.messages[messageIndex],
                      read: newRead,
                      active: newActive,
                    }
                  }
                }
              },
            ),
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
            dispatch(api.util.invalidateTags(tagsToInvalidate))
            dispatch(api.util.invalidateTags(tagsToInvalidate))
          }
        } catch (error: $Any) {
          const message = `Error: ${error?.error?.data?.detail}`
          console.error(message, error)
          toast.error(message)
          patchResult?.undo()
        }
      },
    },
  },
})

export const { useManageInboxItemMutation } = enhancedRest
