import { createContext, useState, useContext, FC, ReactNode, Dispatch } from 'react'

interface ActionsContextType {
}

const ActionsContext = createContext<ActionsContextType | undefined>(undefined)



export const ActionsProvider: FC<{ children: ReactNode }> = ({ children }) => {


  return (
    <ActionsContext.Provider value={{}}>
      {children}
    </ActionsContext.Provider>
  )
}


export const useActionsContext = (): ActionsContextType => {
  const context = useContext(ActionsContext)
  if (!context) {
    throw new Error('useActionsContext must be used within an ActionsProvider')
  }
  return context
}
