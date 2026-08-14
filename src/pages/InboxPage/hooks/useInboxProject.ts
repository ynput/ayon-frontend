import { useCallback, useEffect, useState } from 'react'
import { useQueryParam } from 'use-query-params'

interface Options {
  enabled?: boolean
}

// the details panel rewrites the same param for the entity it opens, so the selection is
// held here and only mirrored to the URL, never read back from it
const useInboxProject = ({ enabled = true }: Options = {}): [
  string | null,
  (projectName: string | null) => void,
] => {
  const [urlProject, setUrlProject] = useQueryParam<string | undefined>('project')

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
