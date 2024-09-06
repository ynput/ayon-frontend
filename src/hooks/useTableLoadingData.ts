import { useMemo } from 'react'

const useTableLoadingData = (data: any, isLoading: boolean, number = 10, dataKey?: string) => {
  let tableData = data

  const loadingData = useMemo(() => {
    return Array.from({ length: number }, (_, i) => ({
      [dataKey || 'key']: i.toString(),
      data: {},
      isLoading: true,
    }))
  }, [])

  if (isLoading) {
    tableData = loadingData
  }

  return tableData
}

export default useTableLoadingData
