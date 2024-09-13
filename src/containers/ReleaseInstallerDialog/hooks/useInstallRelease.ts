import { GetReleaseInfoApiResponse } from '@api/rest/releases'
import { ReleaseForm } from './useReleaseForm'
import { getReleaseInstallUrls } from '../helpers'
import { useAppDispatch, useAppSelector } from '@state/store'
import { switchDialog } from '@state/releaseInstaller'
import { useCreateInstallerMutation } from '@queries/installers/updateInstallers'
import { useCreateDependencyPackageMutation } from '@queries/dependencyPackages/updateDependencyPackages'
import { DownloadAddonsApiResponse, useDownloadAddonsMutation } from '@queries/addons/updateAddons'
import { InstallResponseModel } from '@api/rest/installers'
import { useEffect, useState } from 'react'
import {
  GetInstallEventsResult,
  InstallEventNode,
  InstallMessage,
  useGetInstallEventsQuery,
} from '@queries/releases/getReleases'
import useLocalStorage from '@hooks/useLocalStorage'

type Props = {
  releaseInfo: GetReleaseInfoApiResponse | undefined
  releaseForm: ReleaseForm
}

// merges events with progress to get labels
export type EventWithProgress = Event & Partial<InstallEventNode> & Partial<InstallMessage>

export const useInstallRelease = ({
  releaseInfo,
  releaseForm,
}: Props): [
  () => Promise<void>,
  boolean,
  EventWithProgress[],
  string | null,
  (events: []) => void,
] => {
  const dispatch = useAppDispatch()
  const dialog = useAppSelector((state) => state.releaseInstaller.dialog)

  const [createInstaller] = useCreateInstallerMutation()
  const [createDependencyPackage] = useCreateDependencyPackageMutation()
  const [downloadAddons] = useDownloadAddonsMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [events, setEvents] = useLocalStorage('install-progress-event-ids', [])
  const eventIds: string[] = events.map((event: any) => event.id)
  const [error, setError] = useState<null | string>(null)

  // query is made once the events are set
  // pubsub listens for events and updates the progress
  const {
    data: progress = [],
    isFetching,
    error: progressError,
  } = useGetInstallEventsQuery({ ids: eventIds }, { skip: !eventIds.length })

  const notFinishedEventIds = progress
    .filter((event) => event.status !== 'finished')
    .map((event) => event.id)

  // switch to progress dialog if there are events running
  useEffect(() => {
    if (notFinishedEventIds.length && dialog !== 'progress') {
      dispatch(switchDialog('progress'))
    } else if (
      eventIds.length &&
      !notFinishedEventIds.length &&
      dialog !== 'progress' &&
      !isFetching
    ) {
      // reset eventIds
      setEvents([])
    }
  }, [notFinishedEventIds, dialog])

  // Start the installation process
  const installRelease = async () => {
    try {
      if (!releaseInfo) throw new Error('No release info')

      // transform release info into install urls
      const { addonInstalls, installerInstalls, dependencyPackageInstalls } = getReleaseInstallUrls(
        releaseInfo,
        releaseForm.addons,
        releaseForm.platforms,
      )

      let promises = []
      // same order as promises so we can map the results to some labels
      let eventLabels = []
      //   create all installers from url
      for (const { url, installer } of installerInstalls) {
        const promise = createInstaller({ installer, force: true, overwrite: true, url }).unwrap()
        promises.push(promise)
        eventLabels.push(`Launcher - ${installer.platform}`)
      }

      //   create all dependency packages from url
      for (const { url, dependencyPackage } of dependencyPackageInstalls) {
        const promise = createDependencyPackage({
          dependencyPackage,
          force: true,
          overwrite: true,
          url,
        }).unwrap()
        promises.push(promise)
        eventLabels.push(`Dependency package - ${dependencyPackage.platform}`)
      }

      //   create all addons from url
      promises.push(downloadAddons({ addons: addonInstalls }).unwrap())
      // add file names
      eventLabels.push(...addonInstalls.map((addon) => `Addon - ${addon.name}`))

      // Wait for all promises to resolve
      setIsSubmitting(true)
      const res = await Promise.all(promises)
      setIsSubmitting(false)

      //   create a flat list of eventIds
      const events = transformEventIds(res, eventLabels)

      // NOTE: The useEffect will switch to the progress screen because of the events

      setEvents(events)
    } catch (error) {
      console.error('Error getting release install urls', error)
      setError(JSON.stringify(error))
      setIsSubmitting(false)
    }
  }

  const eventsWithProgress = mergeEventsWithProgress(events, progress)

  return [
    installRelease,
    isSubmitting,
    eventsWithProgress,
    error || JSON.stringify(progressError),
    setEvents,
  ]
}

// HELPER FUNCTIONS

// creates a flat list of eventIds
type Event = { id: string; label: string }
const transformEventIds = (
  result: (InstallResponseModel | DownloadAddonsApiResponse)[],
  labels: string[],
): Event[] =>
  result
    .flatMap((item) => {
      if (Array.isArray(item)) {
        // If it's an array, return it directly
        return item
      } else if (item?.eventId) {
        // If it's an object with an eventId, return the eventId
        return item.eventId
      }
      return []
    })
    .map((id, i) => ({ id, label: labels[i] }))

const mergeEventsWithProgress = (
  events: Event[],
  progress: GetInstallEventsResult,
): EventWithProgress[] => {
  return events.map((event) => {
    const progressEvent = progress.find((p) => p.id === event.id) || {}
    return { ...event, ...progressEvent }
  })
}
