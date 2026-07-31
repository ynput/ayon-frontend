import { useCallback, useEffect } from 'react'
import { useQueryParam } from 'use-query-params'
import { useLocalStorage } from '@shared/hooks'

const STORAGE_KEY = 'inbox-selected-project'

// Selected project lives in the URL so it can be shared, and in local storage
// so a fresh visit lands back on the project the user last looked at.
const useInboxProject = (
  enabled = true,
): [string | null, (projectName: string | null) => void] => {
  const [urlProject, setUrlProject] = useQueryParam<string | undefined>('project')
  const [storedProject, setStoredProject] = useLocalStorage<string | null>(STORAGE_KEY, null)

  useEffect(() => {
    if (!enabled) return
    if (urlProject === undefined && storedProject) setUrlProject(storedProject, 'replaceIn')
  }, [enabled, urlProject, storedProject, setUrlProject])

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
