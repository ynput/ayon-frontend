import { useCallback, useEffect, useState } from 'react'
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

  // a link opens on the project it names, after that the selection drives the URL
  const [selected, setSelected] = useState<string | null>(urlProject ?? null)

  useEffect(() => {
    if (!enabled) return
    if ((selected ?? undefined) !== urlProject) setUrlProject(selected ?? undefined, 'replaceIn')
  }, [enabled, selected, urlProject, setUrlProject])

  const setProject = useCallback((projectName: string | null) => {
    setSelected(projectName)
  }, [])

  return [enabled ? selected : null, setProject]
}

export default useInboxProject
