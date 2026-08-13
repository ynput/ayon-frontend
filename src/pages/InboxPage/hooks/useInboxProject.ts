import { useCallback, useEffect, useRef } from 'react'
import { useQueryParam } from 'use-query-params'

// not `project`: the details panel owns that one and rewrites it on every message opened
export const INBOX_PROJECT_PARAM = 'inboxProject'

interface Options {
  enabled?: boolean
  viewProject: string | null
  onViewProjectChange: (projectName: string | null) => void
  isReady: boolean
}

// the view owns the selection; the URL only mirrors it so a link opens on the same project
const useInboxProject = ({
  enabled = true,
  viewProject,
  onViewProjectChange,
  isReady,
}: Options): [string | null, (projectName: string | null) => void] => {
  const [urlProject, setUrlProject] = useQueryParam<string | undefined>(INBOX_PROJECT_PARAM)

  // a link wins once on arrival, after that the view drives the URL
  const adopted = useRef(false)

  useEffect(() => {
    if (!enabled || !isReady) return

    if (!adopted.current) {
      adopted.current = true
      if (urlProject && urlProject !== viewProject) {
        onViewProjectChange(urlProject)
        return
      }
    }

    if ((viewProject ?? undefined) !== urlProject) {
      setUrlProject(viewProject ?? undefined, 'replaceIn')
    }
  }, [enabled, isReady, urlProject, viewProject, onViewProjectChange, setUrlProject])

  const setProject = useCallback(
    (projectName: string | null) => {
      setUrlProject(projectName ?? undefined, 'replaceIn')
      onViewProjectChange(projectName)
    },
    [setUrlProject, onViewProjectChange],
  )

  // before the view loads the URL is all we have, or the list flashes the cross-project inbox
  const selected = isReady ? viewProject : urlProject ?? null

  return [enabled ? selected : null, setProject]
}

export default useInboxProject
