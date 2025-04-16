import { createContext, ReactNode, useContext } from 'react'
import { toast } from 'react-toastify'
import { ColumnsConfig } from '@shared/ProjectTreeTable'
import { useGetCurrentUserQuery } from '@queries/auth/getAuth'
import { useSetFrontendPreferencesMutation } from '@queries/user/updateUser'

interface ColumnsConfigContextProps {
  columnsConfig: ColumnsConfig
  updateColumnsConfig: (config: ColumnsConfig) => void
  isLoading: boolean
  isInitialized: boolean
}

const ColumnsConfigContext = createContext<ColumnsConfigContextProps | undefined>(undefined)

interface ColumnsConfigProviderProps {
  children: ReactNode
  projectName: string
}

export const ColumnsConfigProvider = ({ children, projectName }: ColumnsConfigProviderProps) => {
  // GET CURRENT USER
  const { data: user, isLoading: isLoadingUser, isSuccess } = useGetCurrentUserQuery()
  // extract out columns config for project
  const { data: { frontendPreferences: preferences = {} } = {} } = user || {}
  const page = 'overview'
  const pageConfig = preferences?.[page] || {}
  const projectConfig = pageConfig?.[projectName] || {}
  const { columnOrder = [], columnPinning = {}, columnVisibility = {} } = projectConfig

  const columnsConfig: ColumnsConfig = {
    columnOrder,
    columnPinning,
    columnVisibility,
  }

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  // update the user preferences when the columns config changes
  const handleColumnsConfigChange = async (config: ColumnsConfig) => {
    try {
      if (!user?.name) throw { data: { detail: 'User not found' } }
      const updatedPageConfig = { ...pageConfig, [projectName]: config }
      const updatedPreferences = { ...preferences, [page]: updatedPageConfig }
      await updateUserPreferences({
        userName: user.name,
        patchData: updatedPreferences,
        // @ts-expect-error - disableInvalidations is not in the api
        disableInvalidations: true,
      }).unwrap()
    } catch (error: any) {
      console.error(error)
      toast.error(error.data?.detail || 'Error updating columns config')
    }
  }

  return (
    <ColumnsConfigContext.Provider
      value={{
        columnsConfig,
        updateColumnsConfig: handleColumnsConfigChange,
        isLoading: isLoadingUser,
        isInitialized: isSuccess,
      }}
    >
      {children}
    </ColumnsConfigContext.Provider>
  )
}

export const useColumnsConfigContext = () => {
  const context = useContext(ColumnsConfigContext)
  if (!context) {
    throw new Error('useColumnsConfigContext must be used within a ColumnsConfigProvider')
  }
  return context
}
