import { useUpdateInboxMessageMutation } from '/src/services/inbox/updateInbox'

const useUpdateInboxMessage = ({ last, isActive, isImportant }) => {
  // update inbox message
  const [updateMessages] = useUpdateInboxMessageMutation()

  const handleUpdateMessages = async (ids, status, projectName, isActiveChange = false) => {
    if (ids.length > 0) {
      // cacheKeyArgs are not used in the patch but are used to match the cache key to a query (for optimistic updates)
      const cacheKeyArgs = { last, active: isActive, important: isImportant, isActiveChange }
      // update the messages in the backend to toggle read status
      // we use optimistic updates inside updateMessages query
      try {
        await updateMessages({
          status: status,
          projectName: projectName,
          ids: ids,
          ...cacheKeyArgs,
        }).unwrap()
      } catch (error) {
        console.error(error)
      }
    }
  }

  return handleUpdateMessages
}

export default useUpdateInboxMessage
