import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type TitleParts = {
  page: string
  project: string
  entity: string
  base: string
}

type TitleContextType = {
  titleParts: TitleParts
  setPage: (page: string) => void
  setProject: (project: string) => void
  setEntity: (entity: string) => void
  resetTitle: () => void
  buildTitle: () => string
}

type TitleProviderProps = {
  children: ReactNode
}

const TitleContext = createContext<TitleContextType | undefined>(undefined)

export const TitleProvider = ({ children }: TitleProviderProps) => {
  const [titleParts, setTitleParts] = useState<TitleParts>({
    page: '',
    project: '',
    entity: '',
    base: 'Ayon'
  })

  const setPage = useCallback((page: string) => {
    setTitleParts(prev => ({ ...prev, page }))
  }, [])

  const setProject = useCallback((project: string) => {
    setTitleParts(prev => ({ ...prev, project }))
  }, [])

  const setEntity = useCallback((entity: string) => {
    setTitleParts(prev => ({ ...prev, entity }))
  }, [])

  const resetTitle = useCallback(() => {
    setTitleParts({ page: '', project: '', entity: '', base: 'Ayon' })
  }, [])

  const buildTitle = useCallback((): string => {
    const { page, project, entity, base } = titleParts
    const parts: string[] = []
    
    if (entity) parts.push(entity)
    if (page) parts.push(page)
    if (project) parts.push(project)
    
    // Only add base "Ayon" for Dashboard pages or when no other parts exist (fallback)
    const isDashboardPage = page?.toLowerCase().includes('dashboard') || page === 'Tasks' || page === 'Overview'
    const isEmptyTitle = !entity && !page && !project
    
    if (isDashboardPage || isEmptyTitle) {
      parts.push(base)
    }
    
    return parts.length > 0 ? parts.join(' - ') : base
  }, [titleParts])

  const value: TitleContextType = {
    titleParts,
    setPage,
    setProject,
    setEntity,
    resetTitle,
    buildTitle
  }

  return (
    <TitleContext.Provider value={value}>
      {children}
    </TitleContext.Provider>
  )
}

export const useTitleContext = (): TitleContextType => {
  const context = useContext(TitleContext)
  if (!context) {
    throw new Error('useTitleContext must be used within a TitleProvider')
  }
  return context
}