import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Button, Icon } from '@ynput/ayon-react-components'
import type { AddonDevState } from './RemoteModulesContext'
import { clearAddonDevOverride, fetchAddonDevInfo } from './addonDevOverride'

const Banner = styled.div`
  position: fixed;
  left: 8px;
  bottom: 8px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 12px;
  border-radius: 8px;
  font-size: 13px;
  max-width: calc(100vw - 16px);
  color: var(--md-sys-color-on-tertiary-container);
  background: var(--md-sys-color-tertiary-container);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  &.error {
    color: var(--md-sys-color-on-error-container);
    background: var(--md-sys-color-error-container);
  }
`

const POLL_MS = 2000

// Shown while an addon is loaded from its dev server, or when ?addonDev= was asked for and can't
// be used (with the reason). Reloads the page when the dev build changes: federation can't swap a
// remote that is already registered.
export const AddonDevBanner = ({ state }: { state: Exclude<AddonDevState, { status: 'off' }> }) => {
  const [isReloading, setIsReloading] = useState(false)
  const buildId = state.status === 'active' ? state.info.buildId : undefined

  useEffect(() => {
    // also while it could not load: reloads once the dev server answers (e.g. its first build)
    if (state.status !== 'active' && state.status !== 'error') return
    const timer = setInterval(() => {
      fetchAddonDevInfo(state.override).then(
        (info) => {
          if (info.buildId === buildId) return
          setIsReloading(true)
          window.location.reload()
        },
        () => undefined, // the dev server restarting or still failing; keep polling
      )
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [state, buildId])

  const stop = () => {
    clearAddonDevOverride()
    const url = new URL(window.location.href)
    url.searchParams.delete('addonDev')
    window.location.href = url.toString()
  }

  const closeButton = (
    <Button variant="text" icon="close" onClick={stop} data-tooltip="Stop: load the installed addon" />
  )

  if (state.status === 'rejected') {
    return (
      <Banner className="error" data-addon-dev-rejected={state.request}>
        <Icon icon="error" />
        <span>
          Addon dev: ignored ?addonDev={state.request}: {state.reason}
        </span>
        {closeButton}
      </Banner>
    )
  }

  const { addon, url } = state.override
  const error = 'error' in state ? state.error : undefined
  return (
    <Banner className={error ? 'error' : undefined} data-addon-dev={addon}>
      <Icon icon={error ? 'error' : 'code'} />
      {state.status === 'error' ? (
        <span>
          Addon dev: {addon} could not load from {url}: {error}
        </span>
      ) : (
        <span>
          Addon dev: <strong>{addon}</strong> from {url}
          {state.status === 'active' && ` (${state.info.version}, build ${state.info.buildId})`}
          {error && `: ${error}`}
          {isReloading && ', reloading...'}
        </span>
      )}
      {closeButton}
    </Banner>
  )
}
