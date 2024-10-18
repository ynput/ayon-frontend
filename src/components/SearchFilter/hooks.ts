import { useEffect } from 'react'
import { Option } from './types'

type UseFocusOptions = {
  ref: React.RefObject<HTMLUListElement>
  options: Option[] | null
}

export const useFocusOptions = ({ ref, options }: UseFocusOptions) => {
  // map all ids into a string to be used to compare different dropdowns
  const ids = options?.map((option) => option.id)

  useEffect(() => {
    if (!ids) return
    // focus search input
    ref.current?.querySelector('input')?.focus()
  }, [ref, ids?.join('_')])
}
