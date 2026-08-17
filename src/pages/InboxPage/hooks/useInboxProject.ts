import { useCallback } from 'react'
import { useQueryParam } from 'use-query-params'

interface Options {
  enabled?: boolean
}

// not `project`: the details panel rewrites that one for every entity it opens, which would
// silently move the inbox to another project
const PARAM_KEY = 'inboxProject'

const useInboxProject = ({ enabled = true }: Options = {}): [
  string | null,
  (projectName: string | null) => void,
] => {
  const [urlProject, setUrlProject] = useQueryParam<string | undefined>(PARAM_KEY)

  const setProject = useCallback(
    (projectName: string | null) => {
      if (!enabled) return
      setUrlProject(projectName ?? undefined, 'replaceIn')
    },
    [enabled, setUrlProject],
  )

  return [enabled ? urlProject ?? null : null, setProject]
}

export default useInboxProject
