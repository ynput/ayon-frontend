import { useLoadModule } from '@shared/hooks'
import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react'

export type PowerpackFeature =
  | 'slicer'
  | 'annotations'
  | 'releases'
  | 'advancedFilters'
  | 'listAttributes'
  | 'listAccess'
  | 'groupAttributes'
  | 'sharedViews'
export type PowerpackDialogType = {
  label: string
  description: string
  bullet: string
  icon?: string
}

export const powerpackFeatures: {
  [key in PowerpackFeature]: PowerpackDialogType
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
  listAccess: {
    label: 'List Access',
    description: 'Manage and control access to your lists with advanced sharing options.',
    bullet: 'Advanced list sharing options',
  },
  groupAttributes: {
    label: 'Group Attributes',
    description: 'Group tasks by assignees, status, or other attributes for better organization.',
    bullet: 'Group tasks by attributes',
  },
  sharedViews: {
    label: 'Shared Views',
    description: 'Save custom views and share them with team members for better collaboration.',
    bullet: 'Save and share custom views',
  },
}
export type PowerpackContextType = {
  selectedPowerPack: null | PowerpackFeature
  setPowerpackDialog: (open: PowerpackContextType['selectedPowerPack']) => void
  powerpackDialog: PowerpackDialogType | null
  powerLicense: boolean
  isLoading: boolean
}

const PowerpackContext = createContext<PowerpackContextType | undefined>(undefined)

export const PowerpackProvider = ({
  children,
  debug,
}: {
  children: ReactNode
  debug?: { powerLicense?: boolean }
}) => {
  const [selectedPowerPack, setPowerpackDialog] =
    useState<PowerpackContextType['selectedPowerPack']>(null)
  const [isLoading, setIsLoading] = useState(true)

  const resolvePowerPackDialog = (selected: PowerpackContextType['selectedPowerPack']) => {
    if (!selected) return null
    return powerpackFeatures[selected]
  }

  // check license state
  const [powerLicense, setPowerLicense] = useState(false)

  // Define the type for the license check function
  type CheckPowerLicenseFunction = () => Promise<boolean>

  // Fallback function that returns false when the module isn't loaded
  const fallbackCheckLicense: CheckPowerLicenseFunction = async () => false

  // Load the remote module
  const [checkPowerLicense, { isLoaded }] = useLoadModule<CheckPowerLicenseFunction>({
    addon: 'powerpack',
    remote: 'license',
    module: 'checkPowerLicense',
    fallback: fallbackCheckLicense,
  })

  useEffect(() => {
    const checkLicense = async () => {
      if (debug?.powerLicense !== undefined) {
        console.warn('Using debug power license:', debug.powerLicense)
        setPowerLicense(debug.powerLicense)
        setIsLoading(false)
      } else if (isLoaded) {
        try {
          const hasPowerLicense = await checkPowerLicense()
          setPowerLicense(hasPowerLicense)
        } catch (error) {
          console.error('Error checking power license:', error)
          setPowerLicense(false)
        } finally {
          setIsLoading(false)
        }
      }
    }

    checkLicense()
  }, [debug, isLoaded, checkPowerLicense])

  const value = useMemo(
    () => ({
      powerLicense: powerLicense,
      selectedPowerPack,
      setPowerpackDialog,
      powerpackDialog: resolvePowerPackDialog(selectedPowerPack),
      isLoading,
    }),
    [powerLicense, selectedPowerPack, setPowerpackDialog, isLoading],
  )

  return <PowerpackContext.Provider value={value}>{children}</PowerpackContext.Provider>
}

export const usePowerpack = () => {
  const context = useContext(PowerpackContext)
  if (context === undefined) {
    throw new Error('usePowerpack must be used within a PowerpackProvider')
  }
  return context
}
