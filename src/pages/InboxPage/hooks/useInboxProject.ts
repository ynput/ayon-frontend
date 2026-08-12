import { useCallback, useEffect, useRef } from 'react'
import { useQueryParam } from 'use-query-params'

// not `project`: DetailsPanelContext reads that one together with type + id to open an
// entity, so writing the inbox selection into it breaks the details panel deep link
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
  const [entityProject] = useQueryParam<string | undefined>('project')

  // A link wins once on arrival, after that the view drives the URL. Only once - the details
  // panel rewrites `project` on every entity it opens, so reacting to it would switch the
  // list out from under the user whenever they click a message.
  const adopted = useRef(false)

  useEffect(() => {
    if (!enabled || !isReady) return

    if (!adopted.current) {
      adopted.current = true
      const deepLink = urlProject ?? entityProject
      if (deepLink && deepLink !== viewProject) {
        onViewProjectChange(deepLink)
        return
      }
    }

    if ((viewProject ?? undefined) !== urlProject) {
      setUrlProject(viewProject ?? undefined, 'replaceIn')
    }
  }, [enabled, isReady, urlProject, entityProject, viewProject, onViewProjectChange, setUrlProject])

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
