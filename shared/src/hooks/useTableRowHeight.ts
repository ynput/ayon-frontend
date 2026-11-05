import { useCallback } from 'react'
import { useGetCurrentUserQuery, useSetFrontendPreferencesMutation } from '@shared/api'

export const DEFAULT_TABLE_ROW_HEIGHT = 34

/**
 * The row height of the project tables (Overview, Products, Lists, ...). It is one per user, saved in their
 * frontend preferences, so every table has the same rows.
 */
export const useTableRowHeight = () => {
  const { data: user } = useGetCurrentUserQuery()
  const [setFrontendPreferences] = useSetFrontendPreferencesMutation()

  const saved = (user?.data?.frontendPreferences as { tableRowHeight?: unknown } | undefined)
    ?.tableRowHeight
  const rowHeight = typeof saved === 'number' ? saved : DEFAULT_TABLE_ROW_HEIGHT

  const saveRowHeight = useCallback(
    (tableRowHeight: number) => {
      if (!user?.name) return
      // the mutation updates the cached user straight away, so every table follows without a refetch
      setFrontendPreferences({
        userName: user.name,
        patchData: { tableRowHeight },
        // @ts-expect-error - disableInvalidations is not in the api
        disableInvalidations: true,
      })
    },
    [user?.name, setFrontendPreferences],
  )

  return { rowHeight, saveRowHeight }
}
