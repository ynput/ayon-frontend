import React, { useEffect, useMemo } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '/src/components/AddonCard/AddonCard'

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

    if (!event) return
    const element = refs.current[event.id]
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

  //   once all events are finished or failed
  const isAllFinished = useMemo(() => {
    return (
      installProgress.every((event) => event.status === 'finished' || event.status === 'failed') &&
      !!installProgress.length
      //   &&
      //   progressBars.length === installProgress.length
    )
  }, [installProgress])

  return (
    <Styled.Section>
      <h2>Getting Everything Installed...</h2>
      <Styled.PresetsContainer style={{ overflow: 'auto' }}>
        {progressBars
          .filter((file) => file.type !== 'addon' || selectedAddons.includes(file.name))
          .map((file, i) => {
            const res = idsInstalling.find((res) => res.file.url === file.url)

            // find event by id by url
            const eventId = res?.eventId
            // find progress event by id
            const event = installProgress.find((event) => event.id === eventId) || {}
            const status = event?.status || (i === 0 ? 'in_progress' : 'pending')
            const icon = icons[status] || 'hourglass_empty'

            return (
              <AddonCard
                key={file.name}
                name={file.name}
                icon={icon}
                isSyncing={status === 'in_progress'}
                error={status === 'failed' ? event.description : res?.error || null}
                isSelected={status === 'finished'}
                style={{ cursor: 'default' }}
                ref={(el) => eventId && (refs.current[eventId] = el)}
              />
            )
          })}
      </Styled.PresetsContainer>
      <Footer
        back={null}
        next="Finish Setup"
        nextProps={{ active: isAllFinished }}
        onNext={onFinish}
      />
    </Styled.Section>
  )
}

export default ProgressInstall
