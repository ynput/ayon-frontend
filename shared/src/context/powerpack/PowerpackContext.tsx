import { useLoadModule } from '@shared/hooks/useLoadModule'
import { ReactNode, useState, useEffect, useMemo, useCallback } from 'react'
import { addonConfigs, type AddonConfig } from '../../config'

// Re-export from separate feature files for backwards compatibility
export type { PowerpackFeature } from '../../config'
export type { AddonConfig, AddonFeatureKey } from '../../config'

import type { PowerpackFeature } from '../../config'
import { powerpackFeatures } from '../../config'
import { PowerpackContext } from './PowerpackContextInstance'

export type PowerpackDialogType = {
  label: string
  description: string
  bullet: string
  icon?: string
}

// the license check runs in the powerpack remote module, so it only finishes once module
// federation has loaded it. The last result is remembered for pages whose layout depends on it.
const LICENSE_STORAGE_KEY = 'powerpack-license'

const readStoredLicense = (): boolean | null => {
  try {
    const value = localStorage.getItem(LICENSE_STORAGE_KEY)
    return value === null ? null : value === 'true'
  } catch {
    return null
  }
}

const storeLicense = (value: boolean) => {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, String(value))
  } catch {
    // storage unavailable, the next load just waits for the check again
  }
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
  // result of the last check (from an earlier load), null if there never was one.
  // Only for layout that would otherwise wait for the check: `powerLicense` and `isLoading` stay
  // the source of truth, and loading power features early would slow the page down.
  storedLicense: boolean | null
}

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
  const [storedLicense] = useState(readStoredLicense)

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
          storeLicense(hasPowerLicense)
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
      storedLicense,
      selectedPowerPack,
      selectedAddon,
      setPowerpackDialog,
      powerpackDialog: resolvePowerPackDialog(selectedPowerPack),
      addonDialog: resolveAddonDialog(selectedAddon),
    }),
    [powerLicense, selectedPowerPack, selectedAddon, setPowerpackDialog, isLoading, storedLicense],
  )

  return <PowerpackContext.Provider value={value}>{children}</PowerpackContext.Provider>
}
