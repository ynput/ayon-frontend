import { useCallback, useEffect, useRef } from 'react'
import { useQueryParam } from 'use-query-params'
import { useLocalStorage } from '@shared/hooks'

const STORAGE_KEY = 'inbox-selected-project'

// not `project`: DetailsPanelContext reads that one together with type + id to open an
// entity, so writing the inbox selection into it breaks the details panel deep link
const PARAM_KEY = 'inboxProject'

// Selected project lives in the URL so it can be shared, and in local storage
// so a fresh visit lands back on the project the user last looked at.
const useInboxProject = (
  enabled = true,
): [string | null, (projectName: string | null) => void] => {
  const [urlProject, setUrlProject] = useQueryParam<string | undefined>(PARAM_KEY)
  const [entityProject] = useQueryParam<string | undefined>('project')
  const [storedProject, setStoredProject] = useLocalStorage<string | null>(STORAGE_KEY, null)

  // Once, on arrival: fall back to the deep link's project, then to the last one used.
  // Only once - the details panel rewrites `project` on every entity it opens, so reacting
  // to it would switch the list out from under the user whenever they click a message.
  const restored = useRef(false)
  useEffect(() => {
    if (!enabled || restored.current) return
    restored.current = true
    if (urlProject !== undefined) return

    const fallback = entityProject ?? storedProject
    if (fallback) setUrlProject(fallback, 'replaceIn')
  }, [enabled])

  const setProject = useCallback(
    (projectName: string | null) => {
      setUrlProject(projectName ?? undefined, 'replaceIn')
      setStoredProject(projectName)
    },
    [setUrlProject, setStoredProject],
  )

  return [enabled ? urlProject ?? null : null, setProject]
}

export default useInboxProject
