import { useLoadModule } from '@shared/hooks'
import React, { createContext, useContext, ReactNode, FC } from 'react'
import { GroupSettingsFallback } from '../components/GroupSettingsFallback'

interface ProjectTableModuleContextType {
  GroupSettings: typeof GroupSettingsFallback
  requiredVersion?: string
}

const ProjectTableModuleContext = createContext<ProjectTableModuleContextType | undefined>(
  undefined,
)

interface ProjectTableModuleProviderProps {
  children: ReactNode
}

export const ProjectTableModuleProvider: React.FC<ProjectTableModuleProviderProps> = ({
  children,
}) => {
  const [GroupSettings, { outdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'GroupSettings',
    fallback: GroupSettingsFallback,
    minVersion: '1.0.6-dev',
  })

  const value = {
    GroupSettings,
    requiredVersion: outdated?.required,
  }

  return (
    <ProjectTableModuleContext.Provider value={value}>
      {children}
    </ProjectTableModuleContext.Provider>
  )
}

export const useProjectTableModuleContext = (): ProjectTableModuleContextType => {
  const context = useContext(ProjectTableModuleContext)
  if (context === undefined) {
    throw new Error('useProjectTableModuleContext must be used within a ProjectTableModuleProvider')
  }
  return context
}
