import { Section } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'
import AddonFilters from './AddonFilters'
import { useEffect, useMemo, useState } from 'react'
import {
  useGetMarketAddonQuery,
  useGetMarketAddonsQuery,
  useGetMarketInstallEventsQuery,
  useLazyGetMarketAddonQuery,
} from '/src/services/market/getMarket'
import AddonsList from './AddonsList'
import 'react-perfect-scrollbar/dist/css/styles.css'
import AddonDetails from './AddonDetails/AddonDetails'
import { useGetAddonListQuery } from '/src/services/addons/getAddons'
import { mergeAddonWithInstalled } from './mergeAddonsData'
import { throttle } from 'lodash'

const placeholders = [...Array(20)].map((_, i) => ({
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

  // keep track of which addons are being installed
  const [installingAddons, setInstallingAddons] = useState([])
  const [finishedInstalling, setFinishedInstalling] = useState([])

  // subscribe to install events
  const { data: installProgress = [] } = useGetMarketInstallEventsQuery()

  // keep track of install events and update installing addons
  // this is used to show loading and done states on addons
  useEffect(() => {
    if (!installProgress.length) return

    // check for any addons that are still installing
    const installing = installProgress
      .filter((event) => event.status === 'in_progress')
      .map((e) => e?.summary?.addon_name)
    const finished = installProgress
      .filter((event) => event.status === 'finished')
      .map((e) => e?.summary?.addon_name)

    // now update installing addons by removing finished
    const newInstalling = [...new Set([...installingAddons, ...installing])].filter(
      (addon) => !finished.includes(addon),
    )
    const newFinished = [...finishedInstalling, ...finished]

    setInstallingAddons(newInstalling)
    setFinishedInstalling(newFinished)
  }, [installProgress])

  const [selectedAddonId, setSelectedAddonId] = useState(null)

  // GET SELECTED ADDON
  const { data: selectedAddonData = {}, isFetching: isFetchingAddon } = useGetMarketAddonQuery(
    selectedAddonId,
    {
      skip: !selectedAddonId,
    },
  )

  // FILTER ADDONS BY FIELDS
  // [{isOutdated: true}]
  // [{isInstalled: false}]
  const [filter, setFilter] = useState([])

  // // merge installed with market addons
  // let marketAddons = useMemo(() => {
  //   return mergeAddonsData(marketAddonsData, installedAddons)
  // }, [marketAddonsData, installedAddons])

  let marketAddons = useMemo(() => {
    const sortedData = [...marketAddonsData]
    // sort by isInstalled, isOutdated, isOfficial, name
    sortedData?.sort(
      (a, b) =>
        b.isInstalled - a.isInstalled ||
        b.isOutdated - a.isOutdated ||
        b.isOfficial - a.isOfficial ||
        a.name.localeCompare(b.name),
    )

    if (filter.length) {
      return sortedData.filter((addon) => {
        return filter.every((f) => {
          return Object.keys(f).every((key) => {
            return typeof f[key] === 'function' ? f[key](addon[key], addon) : addon[key] == f[key]
          })
        })
      })
    }

    return sortedData
  }, [marketAddonsData, filter])

  // update addon if installingAddons or finishedInstalling changes
  marketAddons = useMemo(() => {
    if (!marketAddons.length || (!installingAddons.length && !finishedInstalling.length))
      return marketAddons
    return marketAddons.map((addon) => {
      const isInstalling = installingAddons.includes(addon.name)
      const isFinished = finishedInstalling.includes(addon.name)
      return {
        ...addon,
        isInstalling,
        isFinished,
      }
    })
  }, [marketAddons, installingAddons, finishedInstalling])

  // merge selected addon with found addon in marketAddons
  const selectedAddon = useMemo(() => {
    if (!selectedAddonId || !marketAddons) return {}
    const found = marketAddons.find((addon) => addon.name === selectedAddonId) || {}

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
        <AddonFilters onSelect={setFilter} />
        <AddonsList
          addons={isLoadingMarket ? placeholders : marketAddons}
          selected={selectedAddonId}
          onSelect={setSelectedAddonId}
          onHover={handleHover}
        />
        <AddonDetails
          addon={selectedAddon}
          isLoading={isLoadingInstalled || isFetchingAddon}
          setInstallingAddons={setInstallingAddons}
          onInstall={(name) => setInstallingAddons([...installingAddons, name])}
        />
      </Section>
    </main>
  )
}

export default MarketPage
