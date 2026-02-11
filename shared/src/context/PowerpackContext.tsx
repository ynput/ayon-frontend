import { useLoadModule } from '@shared/hooks'
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { addonConfigs, type AddonConfig } from '../config'

// Re-export from separate feature files for backwards compatibility
export type { PowerpackFeature } from '../config'
export { powerpackFeatureOrder, powerpackFeatures } from '../config'
export type { AddonConfig, AddonFeatureKey } from '../config'
export { addonConfigs } from '../config'

import type { PowerpackFeature } from '../config'
import { powerpackFeatures } from '../config'

export type PowerpackDialogType = {
  label: string
  description: string
  bullet: string
  icon?: string
}

/** Selection for an addon-specific dialog */
export type AddonDialogSelection = {
  addon: string
  feature?: string
}

/** The dialog can be opened for a power feature or an addon */
export type PowerpackDialogSelection = PowerpackFeature | AddonDialogSelection | null

export type PowerpackContextType = {
  selectedPowerPack: PowerpackFeature | null
  selectedAddon: AddonDialogSelection | null
  setPowerpackDialog: (open: PowerpackDialogSelection) => void
  powerpackDialog: PowerpackDialogType | null
  addonDialog: (AddonConfig & { selectedFeature?: string }) | null
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
  const [selectedPowerPack, setSelectedPowerPack] = useState<PowerpackFeature | null>(null)
  const [selectedAddon, setSelectedAddon] = useState<AddonDialogSelection | null>(null)

  const isAddonSelection = (
    selection: PowerpackDialogSelection,
  ): selection is AddonDialogSelection => {
    return selection !== null && typeof selection === 'object' && 'addon' in selection
  }

  const setPowerpackDialog = useCallback((selection: PowerpackDialogSelection) => {
    if (selection === null) {
      setSelectedPowerPack(null)
      setSelectedAddon(null)
    } else if (isAddonSelection(selection)) {
      setSelectedPowerPack(null)
      setSelectedAddon(selection)
    } else {
      // It's a PowerpackFeature string
      setSelectedAddon(null)
      setSelectedPowerPack(selection)
    }
  }, [])

  const resolvePowerPackDialog = (selected: PowerpackFeature | null) => {
    if (!selected) return null
    return powerpackFeatures[selected]
  }

  const resolveAddonDialog = (
    selected: AddonDialogSelection | null,
  ): (AddonConfig & { selectedFeature?: string }) | null => {
    if (!selected) return null
    const config = addonConfigs[selected.addon]
    if (!config) return null
    return { ...config, selectedFeature: selected.feature }
  }

  // check license state
  const [powerLicense, setPowerLicense] = useState(false)

  // loading state
  const [isLoading, setIsLoading] = useState(true)

  // Define the type for the license check function
  type CheckPowerLicenseFunction = () => Promise<boolean>

  // Fallback function that returns false when the module isn't loaded
  const fallbackCheckLicense: CheckPowerLicenseFunction = async () => false

  // Load the remote module
  const [checkPowerLicense, { isLoaded, isLoading: isLoadingModule }] =
    useLoadModule<CheckPowerLicenseFunction>({
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
      } else if (isLoaded || !isLoadingModule) {
        try {
          const hasPowerLicense = await checkPowerLicense()
          setPowerLicense(hasPowerLicense)
        } catch (error) {
          console.error('Error checking power license:', error)
          setPowerLicense(false)
        } finally {
          setIsLoading(false)
        }
        setIsLoading(false)
      }
    }

    checkLicense()
  }, [debug, isLoaded, isLoadingModule, checkPowerLicense])

  const value = useMemo(
    () => ({
      powerLicense: powerLicense,
      isLoading,
      selectedPowerPack,
      selectedAddon,
      setPowerpackDialog,
      powerpackDialog: resolvePowerPackDialog(selectedPowerPack),
      addonDialog: resolveAddonDialog(selectedAddon),
    }),
    [powerLicense, selectedPowerPack, selectedAddon, setPowerpackDialog, isLoading],
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
