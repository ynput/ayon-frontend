import { Section } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'
import AddonFilters from './AddonFilters'
import { useEffect, useMemo, useState } from 'react'
import {
  useGetMarketAddonQuery,
  useGetMarketAddonsQuery,
  useLazyGetMarketAddonQuery,
} from '/src/services/market/getMarket'
import AddonsList from './AddonsList'
import 'react-perfect-scrollbar/dist/css/styles.css'
import AddonDetails from './AddonDetails/AddonDetails'
import { useGetAddonListQuery } from '/src/services/addons/getAddons'
import { mergeAddonWithInstalled } from './mergeAddonsData'
import { throttle } from 'lodash'

const placeholders = [...Array(10)].map((_, i) => ({
  name: `Addon ${i}`,
  isPlaceholder: true,
  orgTitle: 'Loading...',
}))

const MarketPage = () => {
  // GET ALL ADDONS IN MARKET
  const {
    data: marketAddonsData = [],
    isLoading: isLoadingMarket,
    isError,
  } = useGetMarketAddonsQuery()
  // GET ALL INSTALLED ADDONS for addon details
  const { data: installedAddons = [], isLoading: isLoadingInstalled } = useGetAddonListQuery()

  const [selectedAddonId, setSelectedAddonId] = useState(null)

  // GET SELECTED ADDON
  const { data: selectedAddonData = {}, isFetching: isFetchingAddon } = useGetMarketAddonQuery(
    selectedAddonId,
    {
      skip: !selectedAddonId,
    },
  )
  const marketAddons = useMemo(() => {
    const sortedData = [...marketAddonsData]
    // sort by isInstalled, isOutdated, isOfficial, name
    sortedData?.sort(
      (a, b) =>
        b.isInstalled - a.isInstalled ||
        b.isOutdated - a.isOutdated ||
        b.isOfficial - a.isOfficial ||
        a.name.localeCompare(b.name),
    )

    return sortedData
  }, [marketAddonsData])

  // merge selected addon with found addon in marketAddons
  const selectedAddon = useMemo(() => {
    if (!selectedAddonId || !marketAddons) return {}
    const found = marketAddons.find((addon) => addon.name === selectedAddonId) || {}

    console.log(found, selectedAddonData)

    const merge =
      mergeAddonWithInstalled(
        {
          ...found,
          ...selectedAddonData,
        },
        installedAddons,
      ) || []

    return merge
  }, [selectedAddonData, marketAddons])

  // GET SELECTED ADDON LAZY for performance (fetches on addon hover)
  const [fetchAddonData] = useLazyGetMarketAddonQuery()

  const [cachedIds, setCachedIds] = useState([])
  // prefetch addon
  const handleHover = throttle(async (id) => {
    if (isLoadingMarket) return
    if (cachedIds.includes(id)) return
    setCachedIds([...cachedIds, id])
    await fetchAddonData(id, true)
  }, 1000)

  // once addons are loaded, prefetch the first 3 addons
  useEffect(() => {
    if (!marketAddons || isLoadingMarket) return
    const firstThree = marketAddons.slice(0, 3)
    firstThree.forEach((addon) => {
      setCachedIds([...cachedIds, addon.name])
      fetchAddonData(addon.name, true)
    })
  }, [marketAddons, isLoadingMarket, setCachedIds])

  // pre-fetch next addon in the list when an addon is selected
  // only if it's not already cached and we aren't fetching already
  useEffect(() => {
    if (!selectedAddonId || isLoadingMarket || isFetchingAddon) return
    const index = marketAddons.findIndex((addon) => addon.name === selectedAddonId)
    for (let i = index + 1; i <= index + 3; i++) {
      const nextAddon = marketAddons[i]
      if (nextAddon && !cachedIds.includes(nextAddon.name)) {
        setCachedIds([...cachedIds, nextAddon.name])
        fetchAddonData(nextAddon.name, true)
      }
    }
  }, [selectedAddonId, isLoadingMarket, isFetchingAddon, marketAddons, cachedIds, setCachedIds])

  // FILTER ADDONS BY FIELDS
  // const [filter, setFilter] = useState([])

  if (isError)
    return (
      <Section
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <span>Error loading addons...</span>
      </Section>
    )

  return (
    <main style={{ flexDirection: 'column', overflow: 'hidden' }}>
      <h1 className={Type.headlineSmall}>Addon Market</h1>
      <Section style={{ overflow: 'hidden', flexDirection: 'row', justifyContent: 'center' }}>
        <AddonFilters />
        <AddonsList
          addons={isLoadingMarket ? placeholders : marketAddons}
          selected={selectedAddonId}
          onSelect={setSelectedAddonId}
          onHover={handleHover}
        />
        <AddonDetails addon={selectedAddon} isLoading={isLoadingInstalled || isFetchingAddon} />
      </Section>
    </main>
  )
}

export default MarketPage
