import { Section } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'
import AddonFilters from './AddonFilters'
import { useEffect, useMemo, useState } from 'react'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

import {
  useGetMarketAddonQuery,
  useGetMarketAddonsQuery,
  useGetMarketInstallEventsQuery,
  useLazyGetMarketAddonQuery,
} from '/src/services/market/getMarket'
import MarketAddonsList from './MarketAddonsList'
import 'react-perfect-scrollbar/dist/css/styles.css'
import AddonDetails from './AddonDetails/AddonDetails'
import { useGetAddonListQuery } from '/src/services/addons/getAddons'
import { mergeAddonWithInstalled } from './mergeAddonsData'
import { throttle } from 'lodash'
import styled from 'styled-components'
import useInstall from './AddonDetails/useInstall'
import ConnectDialog from './ConnectDialog/ConnectDialog'
import { useRestart } from '/src/context/restartContext'

const placeholders = [...Array(20)].map((_, i) => ({
  name: `Addon ${i}`,
  isPlaceholder: true,
  orgTitle: 'Loading...',
}))

const StyledHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 8px;
  max-width: 1900px;
  width: 100%;
  margin: auto;

  h1 {
    margin: 8px;
  }
`

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
  // updating is the same as installing really, false, true, 'finished'
  const [isUpdatingAll, setIsUpdatingAll] = useState(false)
  const [isUpdatingAllFinished, setIsUpdatingAllFinished] = useState(false)

  const [isCloudConnected, setIsCloudConnected] = useState(false)
  // if the user hasn't connected to ynput cloud yet
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  // subscribe to install events
  const { data: installProgress = [] } = useGetMarketInstallEventsQuery()

  // QUERY PARAMS STATE
  const [selectedAddonId, setSelectedAddonId] = useQueryParam(
    'addon',
    withDefault(StringParam, null),
  )

  // keep track of install events and update installing addons
  // this is used to show loading and done states on addons
  useEffect(() => {
    if (!installProgress.length) return

    // check for any addons that are still installing
    const installing = installProgress
      .filter((event) => event.status === 'in_progress')
      .map((e) => e?.summary?.name)
    const finished = installProgress
      .filter((event) => event.status === 'finished')
      .map((e) => e?.summary?.name)

    setInstallingAddons((currentInstallingAddons) => {
      const newInstalling = [...new Set([...currentInstallingAddons, ...installing])]
        .filter((addon) => !finished.includes(addon))
        .filter((a) => a)
      return newInstalling
    })

    setFinishedInstalling((f) => [...new Set([...f, ...finished])] || [])
  }, [installProgress, setInstallingAddons, setFinishedInstalling])

  const { restartRequired } = useRestart()
  // callback when restart is requested
  const handleRestarted = () => {
    // reset installing addons
    setInstallingAddons([])
    setFinishedInstalling([])
    setIsUpdatingAll(false)
    setIsUpdatingAllFinished(false)
  }
  // once finished installing has length, show restart banner
  useEffect(() => {
    if (!finishedInstalling.length || installingAddons.length) return
    // all addons have finished installing
    setIsUpdatingAll(false)
    if (isUpdatingAll) setIsUpdatingAllFinished(true)

    restartRequired({ middleware: handleRestarted })
  }, [finishedInstalling, installingAddons])

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
        !!b.isOutdated - !!a.isOutdated ||
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
    if (
      !marketAddons.length ||
      (!installingAddons.length && !finishedInstalling.length && !isUpdatingAll)
    )
      return marketAddons
    return marketAddons.map((addon) => {
      const isWaiting = addon.isOutdated && addon.isInstalled && isUpdatingAll
      const isInstalling = installingAddons.includes(addon.name)
      const isFinished = finishedInstalling.includes(addon.name)
      return {
        ...addon,
        isInstalling,
        isFinished,
        isWaiting,
      }
    })
  }, [marketAddons, installingAddons, finishedInstalling, isUpdatingAll])

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

  const { installAddon } = useInstall((name) => setInstallingAddons((a) => [...a, name]))

  // INSTALL/UPDATE ADDON
  const handleInstall = (name, version) => {
    if (isCloudConnected) {
      return installAddon(name, version)
    } else {
      return setShowConnectDialog(true)
    }
  }

  const handleUpdateAll = async () => {
    setIsUpdatingAll(true)
    // for each outdated addon, install it
    marketAddons.forEach((addon) => {
      if (addon.isOutdated && addon.isInstalled) {
        handleInstall(addon.name, addon.latestVersion)
      }
    })
  }

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
    <>
      <ConnectDialog
        visible={showConnectDialog}
        onHide={() => setShowConnectDialog(false)}
        redirect={`/market?addon=${selectedAddonId}`}
      />
      <main style={{ flexDirection: 'column', overflow: 'hidden' }}>
        <StyledHeader>
          <h1 className={Type.headlineSmall}>Addon Market</h1>
        </StyledHeader>
        <Section style={{ overflow: 'hidden', flexDirection: 'row', justifyContent: 'center' }}>
          <AddonFilters onSelect={setFilter} onConnection={(user) => setIsCloudConnected(!!user)} />
          <MarketAddonsList
            addons={isLoadingMarket ? placeholders : marketAddons}
            selected={selectedAddonId}
            onSelect={setSelectedAddonId}
            onHover={handleHover}
            onInstall={handleInstall}
            isLoading={isLoadingMarket}
            onUpdateAll={marketAddons.some((addon) => addon.isOutdated) && handleUpdateAll}
            isUpdatingAll={isUpdatingAll}
            isUpdatingAllFinished={isUpdatingAllFinished}
          />
          <AddonDetails
            addon={selectedAddon}
            isLoading={isLoadingInstalled || isFetchingAddon}
            setInstallingAddons={setInstallingAddons}
            onInstall={handleInstall}
            isUpdatingAll={isUpdatingAll}
          />
        </Section>
      </main>
    </>
  )
}

export default MarketPage
