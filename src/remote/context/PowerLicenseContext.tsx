import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import useLoadModule from '@/remote/useLoadModule'

// Define the type for the license check function
type CheckPowerLicenseFunction = () => Promise<boolean>

// Fallback function that returns false when the module isn't loaded
const fallbackCheckLicense: CheckPowerLicenseFunction = async () => false

// Create context with default value
const PowerLicenseContext = createContext<boolean>(false)

interface PowerLicenseProviderProps {
  children: ReactNode
}

export const PowerLicenseProvider: React.FC<PowerLicenseProviderProps> = ({ children }) => {
  const [power, setPower] = useState(false)

  // Load the remote module
  const [checkPowerLicense, { isLoaded }] = useLoadModule<CheckPowerLicenseFunction>({
    addon: 'powerpack',
    remote: 'license',
    module: 'checkPowerLicense',
    fallback: fallbackCheckLicense,
  })

  useEffect(() => {
    const checkLicense = async () => {
      if (isLoaded) {
        try {
          const hasPowerLicense = await checkPowerLicense()
          setPower(hasPowerLicense)
        } catch (error) {
          console.error('Error checking power license:', error)
          setPower(false)
        }
      }
    }

    checkLicense()
  }, [isLoaded, checkPowerLicense])

  return <PowerLicenseContext.Provider value={power}>{children}</PowerLicenseContext.Provider>
}

// Custom hook to use the context
export const usePower = (): boolean => {
  return useContext(PowerLicenseContext)
}

export default PowerLicenseContext
