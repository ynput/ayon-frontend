import { createContext, useContext } from 'react'
import type { VersionUploadContextType } from './VersionUploadContext'

export const VersionUploadContext = createContext<VersionUploadContextType | undefined>(undefined)

export const useVersionUploadContext = (): VersionUploadContextType => {
  const context = useContext(VersionUploadContext)
  if (context === undefined) {
    throw new Error('useVersionUploadContext must be used within a VersionUploadProvider')
  }
  return context
}

// Same as useVersionUploadContext but returns null instead of throwing when no provider is mounted.
// Use in shared components that may render under pages without a VersionUploadProvider.
export const useOptionalVersionUploadContext = (): VersionUploadContextType | null => {
  return useContext(VersionUploadContext) ?? null
}
