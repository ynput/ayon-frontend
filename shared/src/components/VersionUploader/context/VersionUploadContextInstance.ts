import { createContext } from 'react'
import { VersionUploadContextType } from './VersionUploadContext'

export const VersionUploadContext = createContext<VersionUploadContextType | undefined>(undefined)
