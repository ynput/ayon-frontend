import { useState } from 'react'

const useSelection = () => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [focused, setFocused] = useState<string | null>(null)

  return { focused, setFocused, rowSelection, setRowSelection }
}

export default useSelection
