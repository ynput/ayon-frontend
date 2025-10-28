import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

type AddonLike = { name: string }
type TableRef = { getTable: () => HTMLElement | null }

function useAddonSelection<T extends AddonLike>(
  addons: T[],
  setAddons: React.Dispatch<React.SetStateAction<T[]>>,
  addonListRef: React.RefObject<TableRef | null>,
  deps: any[] = [],
) {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectAndScrollToAddon = (addon?: T) => {
    if (addon) {
      const foundIndex = addons.findIndex((a) => a.name === addon.name)
      setAddons([addon])

      const tableEl = addonListRef?.current?.getTable()

      if (tableEl) {
        const tbody = tableEl.querySelector('tbody') as HTMLTableSectionElement | null
        const selectedRow = (tbody?.children?.[foundIndex] || null) as HTMLElement | null

        if (selectedRow) {
          selectedRow.scrollIntoView({
            block: 'center',
          })
        }
      }
    }
  }

  useEffect(() => {
    if (!addons.length || !addonListRef.current) return
    const addonParam = searchParams.get('addon')
    if (!addonParam) return

    const addon = addons.find((a) => a.name === addonParam)

    selectAndScrollToAddon(addon)

    searchParams.delete('addon')
    setSearchParams(searchParams)
  }, [addons, setAddons, addonListRef.current, ...deps])

  return { selectAndScrollToAddon }
}

export default useAddonSelection
