import { Section } from '@ynput/ayon-react-components'
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
import AddonDetails from './MarketDetails/AddonDetails'
import { useListAddonsQuery } from '@queries/addons/getAddons'
import { mergeAddonWithDownloaded } from './mergeAddonsData'
import { throttle } from 'lodash'
import useDownload from './MarketDetails/useDownload'
import ConnectDialog from './ConnectDialog/ConnectDialog'
import { useRestart } from '@context/restartContext'
import { toast } from 'react-toastify'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { useGetReleaseInfoQuery, useGetReleasesQuery } from '@queries/releases/getReleases'
import { transformReleasesToTable } from './helpers'
import ReleaseDetails from './MarketDetails/ReleaseDetails'
import { useAppDispatch } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

const placeholders = [...Array(20)].map((_, i) => ({
  name: `Addon ${i}`,
  isPlaceholder: true,
  subTitle: 'Loading...',
}))

const MarketPage = () => {
  const dispatch = useAppDispatch()
  // GET ALL ADDONS IN MARKET
  const {
    data: marketAddonsData = [],
    isLoading: isLoadingAddons,
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
  const [hasCloudSub, setHasCloudSub] = useState(false)
  // if the user hasn't connected to ynput cloud yet
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  // FILTER ADDONS BY FIELDS
  const [filterType, setFilterType] = useQueryParam('type', withDefault(StringParam, 'addons'))
  // [{isOutdated: true}]
  // [{isDownloaded: false}]
  const [filter, setFilter] = useState([])

  // subscribe to download events
  const { data: downloadProgress = [] } = useGetMarketInstallEventsQuery({})

  // QUERY PARAMS STATE
  const [selectedItemId, setSelectedItemId] = useQueryParam(
    'selected',
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
    { addonName: selectedItemId },
    {
      skip: !selectedItemId || filterType !== 'addons',
    },
  )

  // // merge downloaded with market addons
  // let marketAddons = useMemo(() => {
  //   return mergeAddonsData(marketAddonsData, downloadedAddons)
  // }, [marketAddonsData, downloadedAddons])

  let marketAddons = useMemo(() => {
    let addons = [...marketAddonsData]
    // sort by isDownloaded, isOutdated, isOfficial, name
    addons?.sort(
      (a, b) =>
        b.isDownloaded - a.isDownloaded ||
        !!b.isOutdated - !!a.isOutdated ||
        b.isOfficial - a.isOfficial ||
        a.name.localeCompare(b.name),
    )

    // if there are filters, filter the addons
    if (filter.length) {
      addons = addons.filter((addon) => {
        return filter.every((f) => {
          return Object.keys(f).every((key) => {
            return typeof f[key] === 'function' ? f[key](addon[key], addon) : addon[key] == f[key]
          })
        })
      })
    }

    return addons
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
    if (!selectedItemId || !marketAddons) return {}
    const found = marketAddons.find((addon) => addon.name === selectedItemId) || {}

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

  // GET BUNDLE RELEASES
  const { data: { releases: releasesData = [] } = {}, isLoading: isLoadingReleases } =
    useGetReleasesQuery({ all: true }, { skip: filterType !== 'releases' })

  // transform releases into a table list
  const releaseItems = useMemo(
    () => transformReleasesToTable(releasesData, hasCloudSub),
    [releasesData],
  )

  // GET SELECTED RELEASE
  const { data: selectedReleaseData = {}, isFetching: isFetchingRelease } = useGetReleaseInfoQuery(
    { releaseName: selectedItemId },
    { skip: filterType !== 'releases' },
  )

  // merge selected release with found release in releasesData
  const selectedRelease = useMemo(() => {
    if (!selectedItemId || !releasesData) return {}
    const found = releasesData.find((release) => release.name === selectedItemId) || {}

    return {
      icon: found.icon,
      bio: found.bio,
      isActive: found.isLatest || hasCloudSub,
      ...selectedReleaseData,
    }
  }, [selectedReleaseData, releasesData, selectedItemId])

  // convert addons to grouping format
  const addonsGrouped = useMemo(() => {
    // convert to grouping format for list
    return marketAddons.map((addon) => ({
      type: 'addon',
      group: undefined,
      items: [{ ...addon, subTitle: addon.orgTitle }],
    }))
  }, [marketAddons])

  const tableItems =
    filterType === 'releases'
      ? isLoadingReleases
        ? placeholders
        : releaseItems
      : isLoadingAddons
      ? placeholders
      : addonsGrouped

  // GET SELECTED ADDON LAZY for performance (fetches on addon hover)
  const [fetchAddonData] = useLazyMarketAddonDetailQuery()

  const [cachedIds, setCachedIds] = useState([])
  // prefetch addon
  const handleHover = throttle(async (id, type) => {
    if (!id) return
    if (type !== 'addon') return
    if (isLoadingAddons) return
    if (cachedIds.includes(id)) return
    setCachedIds([...cachedIds, id])
    await fetchAddonData({ addonName: id }, true)
  }, 1000)

  // once addons are loaded, prefetch the first 3 addons
  useEffect(() => {
    if (!marketAddons || isLoadingAddons) return
    const firstThree = marketAddons.slice(0, 3)
    firstThree.forEach((addon) => {
      if (!addon.name) return
      setCachedIds([...cachedIds, addon.name])
      fetchAddonData({ addonName: addon.name }, true)
    })
  }, [marketAddons, isLoadingAddons, setCachedIds])

  // pre-fetch next addon in the list when an addon is selected
  // only if it's not already cached and we aren't fetching already
  useEffect(() => {
    if (!selectedItemId || isLoadingAddons || isFetchingAddon) return
    const index = marketAddons.findIndex((addon) => addon.name === selectedItemId)
    for (let i = index + 1; i <= index + 3; i++) {
      const nextAddon = marketAddons[i]
      if (nextAddon && !cachedIds.includes(nextAddon.name)) {
        if (!nextAddon.name) return
        setCachedIds([...cachedIds, nextAddon.name])
        fetchAddonData({ addonName: nextAddon.name }, true)
      }
    }
  }, [selectedItemId, isLoadingAddons, isFetchingAddon, marketAddons, cachedIds, setCachedIds])

  const { downloadAddon } = useDownload((name) => setDownloadingAddons((a) => [...a, name]))

  // DOWNLOAD/UPDATE ADDON/RELEASE
  const handleAddonDownload = (name, version) => {
    if (isCloudConnected) {
      if (!version) return toast.error('No version found')
      return downloadAddon(name, version)
    } else {
      return setShowConnectDialog(true)
    }
  }

  const handleReleaseInstall = (name) => {
    console.log(name)
    // open menu
    dispatch(toggleReleaseInstaller(name))
  }

  const handleItemDownload = (type, name, version) => {
    switch (type) {
      case 'addon':
        handleAddonDownload(name, version)
        break
      case 'release':
        handleReleaseInstall(name)
        break
      default:
        break
    }
  }

  const handleUpdateAll = async () => {
    setIsUpdatingAll(true)
    // for each outdated addon, download it
    const promises = marketAddons.map((addon) => {
      if (addon.isOutdated && addon.isDownloaded) {
        const res = handleAddonDownload(addon.name, addon.latestVersion)
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

  const handleSelectFilter = (type, filter) => {
    setSelectedItemId(null)
    setFilterType(type)
    setFilter(filter)
  }

  const handleYnputConnect = (isConnected, hasSubs) => {
    if (isConnected) {
      setIsCloudConnected(true)
      setHasCloudSub(hasSubs)
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
        redirect={`/market?addon=${selectedItemId}`}
      />
      <main style={{ flexDirection: 'column', overflow: 'hidden' }}>
        <Section style={{ overflow: 'hidden', flexDirection: 'row', justifyContent: 'center' }}>
          <AddonFilters
            filterType={filterType}
            onSelect={handleSelectFilter}
            onConnection={handleYnputConnect}
          />
          <MarketAddonsList
            items={tableItems}
            selected={selectedItemId}
            onSelect={setSelectedItemId}
            onHover={handleHover}
            onDownload={handleItemDownload}
            isLoading={isLoadingAddons}
            onUpdateAll={marketAddons.some((addon) => addon.isOutdated) && handleUpdateAll}
            isUpdatingAll={isUpdatingAll}
            isUpdatingAllFinished={isUpdatingAllFinished}
          />
          {selectedItemId && filterType === 'releases' && (
            <ReleaseDetails
              release={selectedRelease}
              isLoading={isLoadingReleases || isFetchingRelease}
              onDownload={handleReleaseInstall}
            />
          )}
          {selectedItemId && filterType === 'addons' && (
            <AddonDetails
              addon={selectedAddon}
              isLoading={isLoadingDownloaded || isFetchingAddon}
              setDownloadingAddons={setDownloadingAddons}
              onDownload={handleAddonDownload}
              isUpdatingAll={isUpdatingAll}
            />
          )}
          {!selectedItemId && (
            <div
              style={{ flex: 1, maxWidth: 800, minWidth: 250, padding: 'var(--padding-l)' }}
            ></div>
          )}
        </Section>
      </main>
    </>
  )
}

export default MarketPage
