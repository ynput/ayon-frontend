import { useEffect } from 'react'
import { useTitleContext } from '@context/TitleContext'

type UseTitleOptions = {
  page?: string
  project?: string
  entity?: string
}

type UseTitleReturn = {
  setPage: (page: string) => void
  setProject: (project: string) => void
  setEntity: (entity: string) => void
}

/**
 * Custom hook to set page title parts
 * @param options - Title configuration
 * @param options.page - Page name (e.g., "Settings", "Browser", "Overview")
 * @param options.project - Project name 
 * @param options.entity - Entity name (e.g., folder name, task name)
 */
export const useTitle = ({ page, project, entity }: UseTitleOptions = {}): UseTitleReturn => {
  const { setPage, setProject, setEntity } = useTitleContext()

  useEffect(() => {
    if (page !== undefined) setPage(page)
  }, [page, setPage])

  useEffect(() => {
    if (project !== undefined) setProject(project)
  }, [project, setProject])

  useEffect(() => {
    if (entity !== undefined) setEntity(entity)
  }, [entity, setEntity])

  return { setPage, setProject, setEntity }
}

export default useTitle