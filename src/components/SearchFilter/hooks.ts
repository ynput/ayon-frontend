import { useEffect } from 'react'
import { Option } from './types'

type UseFocusFirstOption = {
  ref: React.RefObject<HTMLUListElement>
  options: Option[] | null
}

export const useFocusFirstOption = ({ ref, options }: UseFocusFirstOption) => {
  // map all ids into a string to be used to compare different dropdowns
  const ids = options?.map((option) => option.id)

  useEffect(() => {
    if (!ids?.length) return
    ref.current?.querySelector('li')?.focus()
  }, [ref, ids?.join('-')])
}
