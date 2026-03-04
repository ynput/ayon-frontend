import { useProjectContext } from '@shared/context'
import { Dialog, DialogProps } from '@ynput/ayon-react-components'
import { FC, useRef, useCallback } from 'react'
import ListRow from '../ListRow/ListRow'
import { toast } from 'react-toastify'
import useGetListsItemsForReviewSession from '@pages/ProjectListsPage/hooks/useGetListsItemsForReviewSession'
import NewReviewSessionLoading from './NewReviewSessionLoading'
import { getEntityTypeIcon } from '@shared/util'

interface NewReviewSessionDialogProps extends Omit<DialogProps, 'onSubmit'> {
  onSubmit: ((listId: string) => Promise<any> | undefined) | undefined
  onCreateEmpty?: () => void
  submitLoading?: boolean
}

const NewReviewSessionDialog: FC<NewReviewSessionDialogProps> = ({
  onClose,
  onSubmit,
  onCreateEmpty,
  submitLoading,
  ...props
}) => {
  const { projectName } = useProjectContext()

  // get a list of all version lists in the project
  const {
    data: listsData,
    isLoading: isLoadingLists,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  } = useGetListsItemsForReviewSession({
    projectName,
  })

  const dialogContentRef = useRef<HTMLDivElement>(null)

  // Detect scroll to bottom and fetch next page if available
  const handleScroll = useCallback(() => {
    const el = dialogContentRef.current
    if (!el || isLoadingLists || isFetchingNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      fetchNextPage()
    }
  }, [isLoadingLists, isFetchingNextPage, fetchNextPage])

  const handleListClick = useCallback(
    async (list: { id: string }) => {
      try {
        if (!onSubmit) {
          throw 'Review addon not installed.'
        }

        // create new list in API
        await onSubmit?.(list.id)

        // Note: closing the dialog and selecting the new list is handled in useNewList.ts
      } catch (error: any) {
        toast.error('Failed to create review session: ' + error || 'Unknown error')
      }
    },
    [onSubmit],
  )
  const handleCreateEmptyReviewList = useCallback(() => {
    // Switch to label input dialog
    onCreateEmpty?.()
  }, [onCreateEmpty])

  const isLoading = isLoadingLists

  return (
    <Dialog {...props} onClose={onClose}>
      <div
        ref={dialogContentRef}
        style={{
          maxHeight: 400,
          overflowY: submitLoading ? 'hidden' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          position: 'relative',
        }}
        onScroll={handleScroll}
      >
        <ListRow
          id={''}
          value={'Create empty review session'}
          icon="add_box"
          count={''}
          style={{
            padding: 6,
            opacity: submitLoading ? 0 : 1,
          }}
          onClick={handleCreateEmptyReviewList}
          tabIndex={0}
        />
        {isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <ListRow
                key={index}
                id={`loading-${index}`}
                value="Loading..."
                count={0}
                icon="layers"
                className="loading"
                style={{ padding: 6 }}
              />
            ))
          : listsData.map((list) => {
              return (
                <ListRow
                  key={list.id}
                  id={list.id}
                  value={list.label}
                  icon={getEntityTypeIcon(list.entityType)}
                  count={list.count}
                  style={{
                    padding: 6,
                    opacity: submitLoading ? 0 : 1,
                  }}
                  onClick={() => handleListClick(list)}
                  tabIndex={0}
                />
              )
            })}
        {/* Optionally show loading indicator */}
        {isFetchingNextPage && <div style={{ padding: 8, textAlign: 'center' }}>Loading...</div>}
        {submitLoading && <NewReviewSessionLoading />}
        {isError && <div>Error loading lists</div>}
      </div>
    </Dialog>
  )
}

export default NewReviewSessionDialog
