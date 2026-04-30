import { useEffect, useMemo } from 'react'
import { isHTMLElement } from '@shared/util'
import { VersionReviewablesModel } from '@shared/api'

type VersionButtonKey = 'selected' | 'previous' | 'next' | 'latest' | 'approved' | 'hero'

type AllVersions = {
  [key in VersionButtonKey]: VersionReviewablesModel | undefined
}

type Statuses = Record<string, { state?: string } | undefined>

export const getVersionShortcutTargets = (
  versions: VersionReviewablesModel[],
  selectedId: string | undefined,
  statuses: Statuses,
): AllVersions => {
  const idx = versions.findIndex((v) => v.id === selectedId)
  const selected = versions[idx]
  const previous = versions[idx - 1]
  const next = versions[idx + 1]
  const latest = versions[versions.length - 1]
  const approved = [...versions]
    .reverse()
    .find(({ status }) => statuses[status]?.state === 'done')
  const hero = versions.find(({ name }) => name === 'HERO')
  return {
    previous: previous || selected,
    selected,
    next: next || selected,
    latest,
    approved,
    hero,
  }
}

interface UseReviewShortcutsProps {
  versions: VersionReviewablesModel[]
  selectedId: string | undefined
  statuses: Statuses
  onChange: (id: string) => void
  toolsRef?: any
}

const useReviewShortcuts = ({
  versions,
  selectedId,
  statuses,
  onChange,
  toolsRef,
}: UseReviewShortcutsProps) => {
  const allVersions = useMemo(
    () => getVersionShortcutTargets(versions, selectedId, statuses),
    [versions, selectedId, statuses],
  )

  useEffect(() => {
    const handleShortcut = (action: VersionButtonKey) => {
      const version = allVersions[action]
      if (!version) return
      if (version.id) onChange(version.id)

      // highlight button briefly — skipped when tool is unmounted (e.g. theatre mode)
      const buttonEl = toolsRef?.current?.querySelector?.(`#${action}-${version.id}`)
      if (!buttonEl) return
      buttonEl.classList.add('highlight')
      setTimeout(() => buttonEl.classList.remove('highlight'), 150)
    }

    const keyMap: Record<string, VersionButtonKey> = {
      a: 'previous',
      d: 'next',
      r: 'latest',
      e: 'approved',
      h: 'hero',
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (isHTMLElement(e.target)) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        if (e.target.isContentEditable) return
      }
      const action = keyMap[e.key]
      if (action) handleShortcut(action)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [allVersions, onChange, toolsRef])
}

export default useReviewShortcuts
