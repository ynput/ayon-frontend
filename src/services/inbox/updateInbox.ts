import { toast } from 'react-toastify'
import API from '@api'
import { $Any } from '@types'
import { ManageInboxItemApiArg } from '@api/rest'
import { current } from '@reduxjs/toolkit'
import { TransformedInboxMessages } from './inboxTransform'

// add some extra types for the patching
export interface Arg extends ManageInboxItemApiArg {
  active: boolean
  important: boolean
  last: number
  isActiveChange: boolean
  isRead: boolean
}

// When reading a message, we need to update the unread count
const patchUnreadCount = (dispatch: $Any, count: number, important: boolean) => {
  dispatch(
    // @ts-ignore
    API.graphql.util.updateQueryData('GetInboxUnreadCount', { important }, (draft) => {
      const newDraft = draft as unknown as number
      // console.log('updating unread count: ', draft - count, count)
      return Math.max(0, newDraft - count)
    }),
  )
}

const enhancedRest = API.rest.enhanceEndpoints({
  endpoints: {
    manageInboxItem: {
      async onQueryStarted(
        {
          active,
          important,
          last,
          isActiveChange,
          isRead,
          manageInboxItemRequest: { ids = [], status },
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
            API.graphql.util.updateQueryData(
              'GetInboxMessages',
              { last, important, active },
              (draft: $Any) => {
                const newDraft = draft as TransformedInboxMessages
                // find the messages to clear
                messages = newDraft.messages
                  .filter((m) => ids.includes(m.referenceId))
                  .map((m) => current(m))
                // filter out the messages to clear
                newDraft.messages = newDraft.messages.filter((m) => !ids.includes(m.referenceId))
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
              API.graphql.util.updateQueryData(
                'GetInboxMessages',
                { last, important: null, active: !active },
                (draft: $Any) => {
                  const newDraft = draft as TransformedInboxMessages
                  // adding message to the new cache
                  console.log('adding message to new cache location')
                  newDraft.messages.unshift(...messagesPatch)
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
            API.graphql.util.updateQueryData(
              'GetInboxMessages',
              { last, active, important },
              (draft: $Any) => {
                const newDraft = draft as TransformedInboxMessages
                for (const id of ids) {
                  const messageIndex = newDraft.messages.findIndex((m) => m.referenceId === id)
                  if (messageIndex !== -1) {
                    newDraft.messages[messageIndex] = {
                      ...newDraft.messages[messageIndex],
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

        try {
          await queryFulfilled

          // invalidate tags AFTER the query is fulfilled and for ALL apis
          if (tagsToInvalidate.length) {
            dispatch(API.graphql.util.invalidateTags(tagsToInvalidate))
            dispatch(API.rest.util.invalidateTags(tagsToInvalidate))
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
