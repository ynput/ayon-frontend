import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Button, Icon } from '@ynput/ayon-react-components'
import type { AddonDevState } from './RemoteModulesContext'
import {
  ADDON_DEV_PARAM,
  addonDevStateKey,
  fetchAddonDevInfo,
  removeAddonDevEntry,
} from './addonDevOverride'

// Only the icon and the open panel take clicks: the page under the rest of the corner stays usable.
const Corner = styled.div`
  position: fixed;
  left: 8px;
  bottom: 8px;
  z-index: 1000;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 4px;
  max-width: calc(100vw - 16px);
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`

const Toggle = styled(Button)`
  && {
    width: 32px;
    height: 32px;
    min-height: 32px;
    padding: 0;
    border-radius: 50%;
    color: var(--md-sys-color-on-tertiary-container);
    background: var(--md-sys-color-tertiary-container);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    opacity: 0.8;

    &:hover,
    &.open {
      opacity: 1;
    }

    &.error {
      color: var(--md-sys-color-on-error-container);
      background: var(--md-sys-color-error-container);
      opacity: 1;
    }
  }
`

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  max-width: min(640px, 100%);
  max-height: calc(100vh - 56px);
  overflow-y: auto;
  border-radius: 8px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-high);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  &:not(.open) {
    display: none;
  }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 2px 2px 8px;
  border-radius: 4px;
  overflow-wrap: anywhere;

  &.error {
    color: var(--md-sys-color-on-error-container);
    background: var(--md-sys-color-error-container);
  }
`

const POLL_MS = 2000
// lets the pointer cross the gap between the icon and the panel
const HOVER_CLOSE_MS = 200

// The dev overrides behind a small icon in the bottom left corner (the error colour when one of
// them can't load); hover or click it for one row per ?addonDev= entry: the addon loaded from its
// dev server, or why it can't be. The rows stay mounted while the panel is closed: each reloads the
// page when its dev build changes (federation can't swap a remote that is already registered), and
// its close button drops only that addon.
export const AddonDevBanner = ({ states }: { states: AddonDevState[] }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const corner = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>()
  const hasError = states.some((state) => state.status === 'rejected' || 'error' in state)
  const isOpen = isHovered || isPinned

  const hover = (isOver: boolean) => {
    clearTimeout(hoverTimer.current)
    if (isOver) setIsHovered(true)
    else hoverTimer.current = setTimeout(() => setIsHovered(false), HOVER_CLOSE_MS)
  }
  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  useEffect(() => {
    if (!isOpen) return
    const close = () => {
      // focus on a row's button would stay on a hidden element
      if (corner.current?.contains(document.activeElement)) toggle.current?.focus()
      clearTimeout(hoverTimer.current)
      setIsHovered(false)
      setIsPinned(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    const onPointer = (event: MouseEvent) => {
      if (isPinned && !corner.current?.contains(event.target as Node)) setIsPinned(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, isPinned])

  return (
    <Corner ref={corner} onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      <Toggle
        ref={toggle}
        icon={hasError ? 'error' : 'code'}
        className={[hasError && 'error', isOpen && 'open'].filter(Boolean).join(' ')}
        onClick={() => setIsPinned((pinned) => !pinned)}
        aria-label="Addons loaded from dev servers"
        aria-expanded={isOpen}
        data-addon-dev-toggle
      />
      <Panel className={isOpen ? 'open' : undefined}>
        {states.map((state) => (
          <AddonDevRow key={addonDevStateKey(state)} state={state} />
        ))}
      </Panel>
    </Corner>
  )
}

const AddonDevRow = ({ state }: { state: AddonDevState }) => {
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
          // from the stored overrides, not this tab's ?addonDev=: another tab may have closed one
          const url = new URL(window.location.href)
          url.searchParams.delete(ADDON_DEV_PARAM)
          window.location.replace(url.toString())
        },
        () => undefined, // the dev server restarting or still failing; keep polling
      )
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [state, buildId])

  const stop = () => {
    const url = new URL(window.location.href)
    const rest = removeAddonDevEntry(
      addonDevStateKey(state),
      url.searchParams.getAll(ADDON_DEV_PARAM),
    )
    url.searchParams.delete(ADDON_DEV_PARAM)
    if (rest) url.searchParams.set(ADDON_DEV_PARAM, rest)
    window.location.href = url.toString()
  }

  const closeButton = (
    <Button
      variant="text"
      icon="close"
      onClick={stop}
      data-tooltip="Stop: load the installed addon"
    />
  )

  if (state.status === 'rejected') {
    return (
      <Row className="error" data-addon-dev-rejected={state.request}>
        <Icon icon="error" />
        <span>
          Ignored ?addonDev={state.request}: {state.reason}
        </span>
        {closeButton}
      </Row>
    )
  }

  const { addon, url } = state.override
  const error = 'error' in state ? state.error : undefined
  return (
    <Row className={error ? 'error' : undefined} data-addon-dev={addon}>
      <Icon icon={error ? 'error' : 'code'} />
      {state.status === 'error' ? (
        <span>
          {addon} could not load from {url}: {error}
        </span>
      ) : (
        <span>
          <strong>{addon}</strong> from {url}
          {state.status === 'active' && ` (${state.info.version}, build ${state.info.buildId})`}
          {state.status === 'loading' && ', loading...'}
          {error && `: ${error}`}
          {isReloading && ', reloading...'}
        </span>
      )}
      {closeButton}
    </Row>
  )
}
