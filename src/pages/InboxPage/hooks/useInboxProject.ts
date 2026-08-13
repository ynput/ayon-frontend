import { useCallback, useEffect, useRef } from 'react'
import { useQueryParam } from 'use-query-params'

// not `project`: DetailsPanelContext reads that one together with type + id to open an
// entity, and the details panel rewrites it on every message opened, so reusing it would
// both break the deep link and pin the inbox to whatever was last clicked
export const INBOX_PROJECT_PARAM = 'inboxProject'

interface Options {
  enabled?: boolean
  // selection stored in the current view - the source of truth once views have loaded
  viewProject: string | null
  onViewProjectChange: (projectName: string | null) => void
  isReady: boolean
}

// The selected project is stored in the view so it is saved with the rest of the filter
// setup, and mirrored into the URL so a link opens on the same project.
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

  // until the views have loaded the URL is all we have, otherwise the list would flash
  // the cross-project inbox before the stored selection arrives
  const selected = isReady ? viewProject : urlProject ?? null

  return [enabled ? selected : null, setProject]
}

export default useInboxProject
