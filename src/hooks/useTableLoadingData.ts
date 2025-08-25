import { useMemo } from 'react'

interface LoadingTableItem {
  [key: string]: string | number | boolean | Record<string, unknown>
  data: Record<string, unknown>
  isLoading: boolean
}

const useTableLoadingData = <T = unknown>(
  data: T[] | undefined,
  isLoading: boolean,
  number = 10,
  dataKey?: string
): (T | LoadingTableItem)[] => {
  const loadingData = useMemo(() => {
    return Array.from({ length: number }, (_, i) => ({
      [dataKey || 'key']: i.toString(),
      data: {},
      isLoading: true,
    }))
  }, [number, dataKey])

  if (isLoading) {
    return loadingData
  }

  return data || []
}

export default useTableLoadingData
