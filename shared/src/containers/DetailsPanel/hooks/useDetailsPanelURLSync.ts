import { useEffect } from 'react'

type EntitiesToQuery = { id?: string; projectName?: string }[]

type UseDetailsPanelURLSyncParams = {
  entityData?: any
  project?: string
  activeEntityType?: string
  entitiesToQuery?: EntitiesToQuery
}

export default function useDetailsPanelURLSync({
  entityData,
  project,
  activeEntityType,
  entitiesToQuery = [],
}: UseDetailsPanelURLSyncParams) {
  useEffect(() => {
    if (!entityData?.parents) return
    if (!project) return

    const url = new URL(window.location.href)
    const searchParams = url.searchParams

    // set project name
    searchParams.set('project', project)
    // set panel entityType
    if (activeEntityType) searchParams.set('type', activeEntityType)

    // set entity id for the project (only the first entity)
    const firstEntityId = (entitiesToQuery || [])
      .filter((e) => e.projectName === project)
      .map((e) => e.id)
      .filter(Boolean)[0]
    if (firstEntityId) searchParams.set('id', firstEntityId)

    // update the URL without reloading the page
    const newUrl = `${url.pathname}?${searchParams.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [entityData, project, activeEntityType, entitiesToQuery])
}
