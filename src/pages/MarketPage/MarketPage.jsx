import { Section } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'
import AddonFilters from './AddonFilters'
import { useEffect, useMemo, useState } from 'react'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

import {
  useMarketAddonListQuery,
  useMarketAddonDetailQuery,
  useGetMarketInstallEventsQuery,
  useLazyMarketAddonDetailQuery,
} from '@queries/market/getMarket'
import MarketAddonsList from './MarketAddonsList'
import 'react-perfect-scrollbar/dist/css/styles.css'
import AddonDetails from './AddonDetails/AddonDetails'
import { useListAddonsQuery } from '@queries/addons/getAddons'
import { mergeAddonWithDownloaded } from './mergeAddonsData'
import { throttle } from 'lodash'
import styled from 'styled-components'
import useDownload from './AddonDetails/useDownload'
import ConnectDialog from './ConnectDialog/ConnectDialog'
import { useRestart } from '@context/restartContext'
import { toast } from 'react-toastify'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'

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
    error,
  } = useMarketAddonListQuery()
  // GET ALL INSTALLED ADDONS for addon details
  const { data: { addons: downloadedAddons = [] } = {}, isLoading: isLoadingDownloaded } =
    useListAddonsQuery({})

  // keep track of which addons are being downloaded
  const [downloadingAddons, setDownloadingAddons] = useState([])
  const [finishedDownloading, setFinishedDownloading] = useState([])
  const [failedDownloading, setFailedDownloading] = useState([])
  // updating is the same as downloading really, false, true, 'finished'
  const [isUpdatingAll, setIsUpdatingAll] = useState(false)
  const [isUpdatingAllFinished, setIsUpdatingAllFinished] = useState(false)

  const [isCloudConnected, setIsCloudConnected] = useState(false)
  // if the user hasn't connected to ynput cloud yet
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  // subscribe to download events
  const { data: downloadProgress = [] } = useGetMarketInstallEventsQuery({})

  // QUERY PARAMS STATE
  const [selectedAddonId, setSelectedAddonId] = useQueryParam(
    'addon',
    withDefault(StringParam, null),
  )

  // keep track of download events and update downloading addons
  // this is used to show loading and done states on addons
  useEffect(() => {
    if (!downloadProgress.length) return

    // check for any addons that are still downloading
    const downloading = downloadProgress
      .filter((e) => e.status === 'in_progress')
      .map((e) => e?.summary?.name)
    const finished = downloadProgress
      .filter((e) => e.status === 'finished')
      .map((e) => e?.summary?.name)

    const failedEvents = downloadProgress.filter((e) => e.status === 'failed' && e?.summary?.name)
    const failedMessages = failedEvents.map((e) => ({
      name: e.summary?.name,
      error: e?.description.replace('Failed to process event: ', ''),
    }))
    const failedAddons = failedEvents.map((e) => e?.summary?.name)

    setDownloadingAddons((currentDownloadingAddons) => {
      const newDownloading = [...new Set([...currentDownloadingAddons, ...downloading])]
        .filter((addon) => !finished.includes(addon))
        .filter((addon) => !failedAddons.includes(addon))
        .filter((a) => a)
      return newDownloading
    })

    setFinishedDownloading((f) => [...new Set([...f, ...finished])])

    setFailedDownloading((f) => {
      // check if for duplicates
      const newFailed = failedMessages.filter((e) => !f.some((addon) => addon.name === e.name))
      return [...f, ...newFailed]
    })
  }, [downloadProgress, setDownloadingAddons, setFinishedDownloading])

  const { restartRequired } = useRestart()
  // callback when restart is requested
  const handleRestarted = () => {
    // reset downloading addons
    setDownloadingAddons([])
    setFinishedDownloading([])
    setIsUpdatingAll(false)
    setIsUpdatingAllFinished(false)
  }
  // once finished downloading has length, show restart banner
  useEffect(() => {
    if ((finishedDownloading.length || failedDownloading.length) && !downloadingAddons.length) {
      // all addons have finished downloading
      setIsUpdatingAll(false)
      // show all updated complete if none failed
      if (isUpdatingAll && !failedDownloading.length) setIsUpdatingAllFinished(true)

      if (finishedDownloading.length) {
        restartRequired({ callback: () => handleRestarted })
      }
    }
  }, [finishedDownloading, downloadingAddons])

  // GET SELECTED ADDON
  const { data: selectedAddonData = {}, isFetching: isFetchingAddon } = useMarketAddonDetailQuery(
    { addonName: selectedAddonId },
    {
      skip: !selectedAddonId,
    },
  )

  // FILTER ADDONS BY FIELDS
  // [{isOutdated: true}]
  // [{isDownloaded: false}]
  const [filter, setFilter] = useState([])

  // // merge downloaded with market addons
  // let marketAddons = useMemo(() => {
  //   return mergeAddonsData(marketAddonsData, downloadedAddons)
  // }, [marketAddonsData, downloadedAddons])

  let marketAddons = useMemo(() => {
    const sortedData = [...marketAddonsData]
    // sort by isDownloaded, isOutdated, isOfficial, name
    sortedData?.sort(
      (a, b) =>
        b.isDownloaded - a.isDownloaded ||
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

  // update addon if downloadingAddons or finishedDownloading changes
  marketAddons = useMemo(() => {
    if (
      !marketAddons.length ||
      (!downloadingAddons.length &&
        !finishedDownloading.length &&
        !failedDownloading.length &&
        !isUpdatingAll)
    ) {
      return marketAddons
    }
    return marketAddons.map((addon) => {
      const isWaiting = addon.isOutdated && addon.isDownloaded && isUpdatingAll
      const isDownloading = downloadingAddons.includes(addon.name)
      const isFinished = finishedDownloading.includes(addon.name)
      const error = failedDownloading.find((f) => f.name === addon.name)?.error
      return {
        ...addon,
        isDownloading,
        isFinished,
        isWaiting,
        isFailed: !!error,
        error,
      }
    })
  }, [marketAddons, downloadingAddons, finishedDownloading, failedDownloading, isUpdatingAll])

  // merge selected addon with found addon in marketAddons
  const selectedAddon = useMemo(() => {
    if (!selectedAddonId || !marketAddons) return {}
    const found = marketAddons.find((addon) => addon.name === selectedAddonId) || {}

    const merge =
      mergeAddonWithDownloaded(
        {
          ...found,
          ...selectedAddonData,
        },
        downloadedAddons,
      ) || []

    return merge
  }, [selectedAddonData, marketAddons])

  // GET SELECTED ADDON LAZY for performance (fetches on addon hover)
  const [fetchAddonData] = useLazyMarketAddonDetailQuery()

  const [cachedIds, setCachedIds] = useState([])
  // prefetch addon
  const handleHover = throttle(async (id) => {
    if (isLoadingMarket) return
    if (cachedIds.includes(id)) return
    setCachedIds([...cachedIds, id])
    await fetchAddonData({ addonName: id }, true)
  }, 1000)

  // once addons are loaded, prefetch the first 3 addons
  useEffect(() => {
    if (!marketAddons || isLoadingMarket) return
    const firstThree = marketAddons.slice(0, 3)
    firstThree.forEach((addon) => {
      setCachedIds([...cachedIds, addon.name])
      fetchAddonData({ addonName: addon.name }, true)
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
        fetchAddonData({ addonName: nextAddon.name }, true)
      }
    }
  }, [selectedAddonId, isLoadingMarket, isFetchingAddon, marketAddons, cachedIds, setCachedIds])

  const { downloadAddon } = useDownload((name) => setDownloadingAddons((a) => [...a, name]))

  // DOWNLOAD/UPDATE ADDON
  const handleDownload = (name, version) => {
    if (isCloudConnected) {
      return downloadAddon(name, version)
    } else {
      return setShowConnectDialog(true)
    }
  }

  const handleUpdateAll = async () => {
    setIsUpdatingAll(true)
    // for each outdated addon, download it
    const promises = marketAddons.map((addon) => {
      if (addon.isOutdated && addon.isDownloaded) {
        const res = handleDownload(addon.name, addon.latestVersion)
        return res
      }
    })

    const responses = await Promise.all(promises).for

    const errors = responses.filter((r) => r.error)
    const success = responses.filter((r) => r.data)
    if (errors.length) {
      console.error(errors)
      toast.error('Error updating addons')
    }

    if (!success.length) {
      setIsUpdatingAll(false)
      setIsUpdatingAllFinished(true)
    }
  }

  if (error)
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
        <EmptyPlaceholder error={JSON.stringify(error)} />
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
            onDownload={handleDownload}
            isLoading={isLoadingMarket}
            onUpdateAll={marketAddons.some((addon) => addon.isOutdated) && handleUpdateAll}
            isUpdatingAll={isUpdatingAll}
            isUpdatingAllFinished={isUpdatingAllFinished}
          />
          <AddonDetails
            addon={selectedAddon}
            isLoading={isLoadingDownloaded || isFetchingAddon}
            setDownloadingAddons={setDownloadingAddons}
            onDownload={handleDownload}
            isUpdatingAll={isUpdatingAll}
          />
        </Section>
      </main>
    </>
  )
}

export default MarketPage
