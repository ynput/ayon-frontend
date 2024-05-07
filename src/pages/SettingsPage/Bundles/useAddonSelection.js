import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const useAddonSelection = (addons, setAddons, addonListRef, deps = []) => {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectAndScrollToAddon = (addon) => {
    if (addon) {
      const foundIndex = addons.findIndex((a) => a.name === addon.name)
      setAddons([addon])

      const tableEl = addonListRef?.current?.getTable()

      if (tableEl) {
        const tbody = tableEl.querySelector('tbody')
        const selectedRow = tbody.children[foundIndex]

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
