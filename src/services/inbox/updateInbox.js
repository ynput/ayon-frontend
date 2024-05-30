import { toast } from 'react-toastify'
import { ayonApi } from '../ayon'
import { current } from '@reduxjs/toolkit'

// When reading a message, we need to update the unread count
const patchUnreadCount = (dispatch, count, important) => {
  dispatch(
    ayonApi.util.updateQueryData('getInboxUnreadCount', { important }, (draft) => {
      return draft + count
    }),
  )
}

const updateInbox = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateInboxMessage: build.mutation({
      query: ({ status, projectName, ids = [] }) => ({
        url: `/api/inbox`,
        method: 'POST',
        body: { status, projectName, ids },
      }),
      async onQueryStarted(
        { ids, status, active, important, last, isActiveChange },
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

        if (isActiveChange) {
          // this means we are changing the active (cleared) status of the message
          // if will be moving from one cache to another

          let messages = []

          //   the cache to remove from (current tab)
          dispatch(
            ayonApi.util.updateQueryData('getInbox', { last, important, active }, (draft) => {
              // find the messages to clear
              messages = draft.messages
                .filter((m) => ids.includes(m.referenceId))
                .map((m) => current(m))
              // filter out the messages to clear
              draft.messages = draft.messages.filter((m) => !ids.includes(m.referenceId))
            }),
          )

          //  now where do we add the cleared message
          if (active) {
            // when clearing a message
            // it will always go to the cleared tab (active=false) (important=null)
            const messagesPatch = messages.map((m) => ({ ...m, active: false, read: true }))

            //   the cache to add to (cleared/important/other tab)
            dispatch(
              ayonApi.util.updateQueryData(
                'getInbox',
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
            dispatch(
              ayonApi.util.invalidateTags([
                { type: 'inbox', id: `active=true/important=false` },
                { type: 'inbox', id: `active=true/important=true` },
                { type: 'inbox', id: 'unreadCount' }, //the counters
              ]),
            )
          }
        } else {
          // only updating the read status of the message
          // patch new data into the cache
          patchResult = dispatch(
            ayonApi.util.updateQueryData('getInbox', { last, active, important }, (draft) => {
              for (const id of ids) {
                const messageIndex = draft.messages.findIndex((m) => m.referenceId === id)
                if (messageIndex !== -1) {
                  console.log('updating message')
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

        const positiveCount = ids.length
        // we need to update the unread count
        if (status === 'unread' && !isActiveChange) {
          // a message being marked as unread (in other or important)
          patchUnreadCount(dispatch, positiveCount, important)
        } else if (status === 'read' || status === 'inactive') {
          // a message being marked as read or being cleared (and then marked as read)
          patchUnreadCount(dispatch, -positiveCount, important)
        }

        try {
          await queryFulfilled
        } catch (error) {
          const message = `Error: ${error?.error?.data?.detail}`
          console.error(message, error)
          toast.error(message)
          patchResult.undo()
        }
      },
      invalidatesTags: () => [{ type: 'inbox', id: 'hasUnread' }],
    }),
  }),
})

export const { useUpdateInboxMessageMutation } = updateInbox
