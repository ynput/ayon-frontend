import { useProjectDataContext } from '@shared/containers'
import { Dialog, DialogProps } from '@ynput/ayon-react-components'
import { FC, useRef, useCallback } from 'react'
import ListRow from '../ListRow/ListRow'
import { toast } from 'react-toastify'
import useGetListsItemsForReviewSession from '@pages/ProjectListsPage/hooks/useGetListsItemsForReviewSession'
import calculateListsTotalReviewableVersions from '@pages/ProjectListsPage/util/calculateListsTotalReviewableVersions'
import NewReviewSessionLoading from './NewReviewSessionLoading'

interface NewReviewSessionDialogProps extends Omit<DialogProps, 'onSubmit'> {
  onSubmit: ((listId: string) => Promise<any>) | undefined
  submitLoading?: boolean
}

const NewReviewSessionDialog: FC<NewReviewSessionDialogProps> = ({
  onClose,
  onSubmit,
  submitLoading,
  ...props
}) => {
  const { projectName } = useProjectDataContext()

  // get a list of all version lists in the project
  const {
    data: versionsListsData,
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
    async (list: {
      id: string
      items: ({ id: string; hasReviewables?: boolean } | undefined | null)[]
    }) => {
      try {
        const versionIds = list.items.filter((v) => v?.hasReviewables).map((v) => v?.id) as string[]
        if (!versionIds.length) {
          throw 'No reviewable versions found in the selected list.'
        }

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
          : versionsListsData.map((list) => {
              const noReviewableVersions = calculateListsTotalReviewableVersions(list) < 1

              return (
                <ListRow
                  key={list.id}
                  id={list.id}
                  value={list.label}
                  icon={'layers'} // icon for versions
                  count={noReviewableVersions ? 'No reviewables' : list.count}
                  style={{
                    padding: 6,
                    opacity: submitLoading ? 0 : 1,
                  }}
                  onClick={() => handleListClick(list)}
                  disabled={noReviewableVersions}
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
