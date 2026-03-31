import { useCallback, useState } from "react"

type Args = {
  items: string[]
}

export default function useMultiSelect({ items }: Args) {
  const [selection, setSelection] = useState<Set<string>>(new Set())

  const getClickHandler = useCallback((uniqueDataValue: string, index: number) => (ctrl: boolean, shift: boolean) => {
    setSelection((s) => {
      const toAdd = new Set([uniqueDataValue])
      if (ctrl) {
        // add or remove this specific mapper from the selection
        return s.has(uniqueDataValue)
          ? s.difference(toAdd)
          : s.union(toAdd)
      } else if (shift && s.size > 0) {
        // select a range of mappers from the first selected one to the clicked one
        const firstSelectedIndex = items.findIndex((value) => s.has(value))
        if (firstSelectedIndex >= 0) {
          // automatically inverts the range if the first selected index is higher than the clicked index
          const range = items.slice(
            Math.min(firstSelectedIndex, index),
            Math.max(firstSelectedIndex, index),
          )

          return s
            .union(toAdd)
            .union(new Set(range))
        }
      }
      // If no modifier key pressed or there's no existing selection,
      // just add/remove the current mapper.
      return s.has(uniqueDataValue)
        ? new Set()
        : toAdd
    })
  }, [])

  return {
    selection,
    getClickHandler,
    reset: () => setSelection(new Set()),
  }
}
