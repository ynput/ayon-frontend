import { createContext, useContext, ReactNode, useState } from 'react'

export type PowerpackFeature =
  | 'slicer'
  | 'annotations'
  | 'releases'
  | 'advancedFilters'
  | 'listAttributes'
  | 'groupAttributes'
type PowerpackDialog = {
  label: string
  description: string
  bullet: string
}

export const powerpackFeatures: {
  [key in PowerpackFeature]: PowerpackDialog
} = {
  slicer: {
    label: 'Slicer',
    description: 'Advanced filtering system for project organization.',
    bullet: 'Powerful project filtering tools',
  },
  annotations: {
    label: 'Annotations',
    description: 'Create detailed visual feedback directly on media files.',
    bullet: 'Advanced media review tools',
  },
  releases: {
    label: 'Release History',
    description: 'Access and download the complete archive of releases',
    bullet: 'Full release archive access',
  },
  advancedFilters: {
    label: 'Advanced Filters',
    description: 'Customize your view and find your data with powerful filtering options',
    bullet: 'Advanced filtering options',
  },
  listAttributes: {
    label: 'List Attributes',
    description: 'Add custom attributes to your lists for better collaboration and organization.',
    bullet: 'Custom attributes for lists',
  },
  groupAttributes: {
    label: 'Group Attributes',
    description: 'Group tasks by assignees, status, or other attributes for better organization.',
    bullet: 'Group tasks by attributes',
  },
}
type PowerpackContextType = {
  selectedPowerPack: null | PowerpackFeature
  setPowerpackDialog: (open: PowerpackContextType['selectedPowerPack']) => void
  powerpackDialog: PowerpackDialog | null
}

const PowerpackContext = createContext<PowerpackContextType>({
  selectedPowerPack: null,
  setPowerpackDialog: () => {},
  powerpackDialog: null,
})

export const PowerpackProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPowerPack, setPowerpackDialog] =
    useState<PowerpackContextType['selectedPowerPack']>(null)

  const resolvePowerPackDialog = (selected: PowerpackContextType['selectedPowerPack']) => {
    if (!selected) return null
    return powerpackFeatures[selected]
  }

  return (
    <PowerpackContext.Provider
      value={{
        selectedPowerPack,
        setPowerpackDialog,
        powerpackDialog: resolvePowerPackDialog(selectedPowerPack),
      }}
    >
      {children}
    </PowerpackContext.Provider>
  )
}

export const usePowerpack = () => useContext(PowerpackContext)
