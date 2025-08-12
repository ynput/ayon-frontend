import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type TitleParts = {
  parentPage?: string
  page?: string
  project?: string
  entity?: string
  base?: string
}

type TitleContextType = {
  titleParts: TitleParts
  setTitleParts: (parts: Partial<TitleParts>) => void
  resetTitle: () => void
  buildTitle: () => string
}

type TitleProviderProps = {
  children: ReactNode
}

const TitleContext = createContext<TitleContextType | undefined>(undefined)

export const TitleProvider = ({ children }: TitleProviderProps) => {
  const [titleParts, setTitlePartsState] = useState<TitleParts>({
    page: '',
    project: '',
    entity: '',
    base: 'Ayon'
  })

  const setTitleParts = useCallback((parts: Partial<TitleParts>) => {
    setTitlePartsState(prev => ({ ...prev, ...parts }))
  }, [])

  const resetTitle = useCallback(() => {
    setTitlePartsState({ page: '', project: '', entity: '', base: 'Ayon' })
  }, [])

  const buildTitle = useCallback((): string => {
    const { parentPage, page, project, entity, base = 'Ayon' } = titleParts
    const parts: string[] = []
    if(parentPage) parts.push(parentPage)
    if (entity) parts.push(entity)
    if (page) parts.push(page)
    if (project) parts.push(project)

    const isEmptyTitle = !entity && !page && !project

    if (isEmptyTitle) {
      parts.push(base)
    }

    return parts.length > 0 ? parts.join(' · ') : base
  }, [titleParts])

  return (
      <TitleContext.Provider value={{ titleParts, setTitleParts, resetTitle, buildTitle }}>
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
