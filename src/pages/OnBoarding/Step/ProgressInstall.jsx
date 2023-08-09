import React, { useEffect, useMemo, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCardProgress from '/src/components/AddonCard/AddonCardProgress'

const icons = {
  pending: 'hourglass_empty',
  in_progress: 'sync',
  finished: 'check_circle',
  failed: 'error',
}

export const ProgressInstall = ({
  installProgress = [],
  release,
  idsInstalling = [],
  selectedAddons = [],
  Footer,
  onFinish,
}) => {
  const refs = React.useRef({})

  //   every time status changes, scroll to eventId
  useEffect(() => {
    // find first status === 'in_progress'
    const event = installProgress.find((event) => event.status === 'in_progress')
    const url = idsInstalling.find((res) => res.eventId === event?.id)?.file?.url

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
    for (const installer of release.installers) {
      const sources = installer.sources.filter(({ type, url }) => type === 'url' && !!url)
      installers.push(
        ...sources.map(({ url }) => ({ url, name: installer.filename, type: 'installer' })),
      )
    }

    const depPackages = []
    for (const depPackage of release.dependencyPackages) {
      const sources = depPackage.sources.filter(({ type, url }) => type === 'url' && !!url)
      depPackages.push(
        ...sources.map(({ url }) => ({ url, name: depPackage.filename, type: 'package' })),
      )
    }

    const addons = release.addons.map(({ url, name }) => ({ url, name, type: 'addon' }))

    return [...addons, ...installers, ...depPackages]
  }, [release])

  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    const allFinished = installProgress.every(
      (event) => event.status === 'finished' || event.status === 'failed',
    )
    if (!allFinished) return
    // we use a timeout to fix flickering at the start
    const id = setTimeout(() => {
      setIsFinished(allFinished && !!installProgress.length)
    }, 1000)

    return () => clearTimeout(id)
  }, [installProgress])

  const title = isFinished ? 'Finished Installation!' : 'Getting Everything Installed...'

  return (
    <Styled.Section>
      <h2>{title}</h2>
      <Styled.PresetsContainer style={{ overflow: 'auto' }}>
        {progressBars
          .filter((file) => file.type !== 'addon' || selectedAddons.includes(file.name))
          .map((file, i) => {
            const url = file.url
            const res = idsInstalling.find((res) => res.file.url === url)

            // find event by id by url
            const eventId = res?.eventId
            // find progress event by id
            const event = installProgress.find((event) => event.id === eventId) || {}
            const status = event?.status || (i === 0 ? 'in_progress' : 'pending')
            const icon = icons[status] || 'hourglass_empty'
            const alreadyInstalled = res?.error?.status == 409
            let progress = event?.progress || 0
            const isFinished = status === 'finished' || alreadyInstalled
            if (isFinished) progress = 100

            const scale = Math.round((progress / 100) * 100) / 100

            return (
              <AddonCardProgress
                key={file.name}
                name={file.name}
                icon={alreadyInstalled ? icons.finished : icon}
                error={
                  status === 'failed'
                    ? event.description
                    : (!alreadyInstalled && res?.error?.detail) || null
                }
                style={{ cursor: 'default', order: file.type === 'addon' ? 2 : 1 }}
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
