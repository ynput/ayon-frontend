import React, { useEffect, useMemo, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCardProgress from '@components/AddonCard/AddonCardProgress'

const findLastEvent = (events = []) => {
  // sort by status, null, pending, in_progress, finished, failed
  // then sort by progress (if status is the same)
  const sortedEvents = [...events].sort((a, b) => {
    if (a.status === b.status) return b.progress - a.progress
    if (a.status === 'failed') return -1
    if (b.status === 'failed') return 1
    if (a.status === 'finished') return -1
    if (b.status === 'finished') return 1
    if (a.status === 'in_progress') return -1
    if (b.status === 'in_progress') return 1
    if (a.status === 'pending') return -1
    if (b.status === 'pending') return 1
    return 0
  })

  return sortedEvents[0]
}

const icons = {
  pending: 'hourglass_empty',
  in_progress: 'sync',
  finished: 'check_circle',
  failed: 'error',
}

export const ProgressInstall = ({
  installProgress = [],
  release = {},
  idsInstalling = [],
  selectedAddons = [],
  selectedPlatforms = [],
  Header,
  Footer,
  onFinish,
  isFinished,
  setIsFinished,
}) => {
  const refs = React.useRef({})

  //   every time status changes, scroll to eventId
  useEffect(() => {
    // find first status === 'in_progress'
    const event = installProgress.find((event) => event?.status === 'in_progress')
    const url = idsInstalling.find((res) => res?.eventId === event?.id)?.file?.url

    if (!url) return
    const element = refs.current[url]
    if (!element) return
    // scroll to event
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [installProgress, refs])

  const progressBars = useMemo(() => {
    const installers = []
    if (release?.installers?.length) {
      for (const installer of release.installers) {
        // skip if platform is not selected
        if (!selectedPlatforms.includes(installer.platform)) continue
        const sources = installer?.sources?.filter(({ type, url }) => type === 'http' && !!url)
        installers.push(
          ...sources.map(({ url }) => ({ url, name: installer?.filename, type: 'installer' })),
        )
      }
    }

    const depPackages = []
    if (release?.dependencyPackages?.length) {
      for (const depPackage of release.dependencyPackages) {
        // skip if platform is not selected
        if (!selectedPlatforms.includes(depPackage.platform)) continue
        const sources = depPackage.sources.filter(({ type, url }) => type === 'http' && !!url)
        depPackages.push(
          ...sources.map(({ url }) => ({ url, name: depPackage?.filename, type: 'package' })),
        )
      }
    }

    const addons = release?.addons?.map(({ url, name }) => ({ url, name, type: 'addon' })) || []

    return [...addons, ...installers, ...depPackages]
  }, [release])

  useEffect(() => {
    const allFinished = installProgress.every(
      (event) => event?.status === 'finished' || event.status === 'failed',
    )
    if (!allFinished) return
    // we use a timeout to fix flickering at the start
    const id = setTimeout(() => {
      setIsFinished(allFinished && !!installProgress?.length)
    }, 1000)

    return () => clearTimeout(id)
  }, [installProgress])

  // reduce progressBars down to {url: progress || 0}
  const progressInit = progressBars.reduce((acc, file) => {
    acc[file?.url] = 0
    return acc
  }, {})

  const [progress, setProgress] = useState(progressInit)

  // as progress data changes we update the progress state for each url
  useEffect(() => {
    if (!installProgress?.length) return
    const newProgress = { ...progress }

    for (const bar in progress) {
      const url = bar
      const res = idsInstalling.find((res) => res?.file?.url === url)
      if (!res) continue
      // find event by id by url
      const eventId = res?.eventId
      // find all event messages for this event
      const events = installProgress.filter((event) => event?.id === eventId)
      const event = findLastEvent(events)
      if (!event) continue
      const lastProgressValue = newProgress[bar]
      const newProgressValue = event?.progress
      // prevents progress from going backwards
      if (!newProgressValue || newProgressValue < lastProgressValue) continue
      newProgress[bar] = newProgressValue
    }
    setProgress(newProgress)
  }, [installProgress])

  const title = isFinished ? 'Finished Installation!' : 'Getting Everything Installed...'

  return (
    <Styled.Section>
      <Header>{title}</Header>
      <Styled.PresetsContainer style={{ overflow: 'auto' }}>
        {progressBars
          .filter((file) => file?.type !== 'addon' || selectedAddons.includes(file?.name))
          .map((file) => {
            const url = file?.url
            const res = idsInstalling.find((res) => res?.file?.url === url)
            // find event by id by url
            const eventId = res?.eventId
            // find all event messages for this event
            const events = installProgress.filter((event) => event?.id === eventId)

            // find the most relevant event based on status
            const event = findLastEvent(events) || {}

            const status = event?.status || 'pending'

            const icon = icons[status] || 'hourglass_empty'
            const alreadyInstalled = res?.error?.status == 409
            let currentProgress = progress[url]
            const isFinished = status === 'finished' || alreadyInstalled
            if (isFinished) currentProgress = 100
            if (status === 'failed') currentProgress = 0
            const scale = Math.round((currentProgress / 100) * 100) / 100

            return (
              <AddonCardProgress
                key={file?.name}
                name={file?.name}
                icon={alreadyInstalled ? icons?.finished : icon}
                error={
                  status === 'failed'
                    ? event?.description
                    : (!alreadyInstalled && res?.error?.detail) || null
                }
                style={{ cursor: 'default', order: file?.type === 'addon' ? 2 : 1 }}
                ref={(el) => url && (refs.current[url] = el)}
                // progress styled props
                $isSyncing={status === 'in_progress'}
                $isFinished={isFinished}
                $progress={scale}
              />
            )
          })}
      </Styled.PresetsContainer>
      <Footer
        back={null}
        next="Finish Setup"
        nextProps={{
          active: isFinished,
          saving: !isFinished,
          style: { width: 'unset', pointerEvents: !isFinished && 'none' },
        }}
        onNext={onFinish}
        showIcon
      />
    </Styled.Section>
  )
}

export default ProgressInstall
