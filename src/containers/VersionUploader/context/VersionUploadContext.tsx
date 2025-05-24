import {
  GetLatestVersionResult,
  useCreateVersionMutation,
  useGetLatestProductVersionQuery,
} from '@queries/versions/uploadVersions'
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'
import { FormData } from '../components/UploadVersionDialog'
import { useCreateProductMutation } from '@queries/product/createProduct'

interface VersionUploadContextType {
  productId: string
  folderId: string
  setProductId: (productId: string) => void
  setFolderId: (folderId: string) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  projectName: string
  version: GetLatestVersionResult | undefined
  onOpenVersionUpload: (params: { productId?: string; folderId?: string }) => void
  onCloseVersionUpload: () => void
  onUploadVersion: (data: FormData) => Promise<void>
}

const VersionUploadContext = createContext<VersionUploadContextType | undefined>(undefined)

interface VersionUploadProviderProps {
  children: ReactNode
  projectName: string
}

export const VersionUploadProvider: React.FC<VersionUploadProviderProps> = ({
  children,
  projectName,
}) => {
  const [folderId, setFolderId] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const { data: version } = useGetLatestProductVersionQuery(
    {
      projectName,
      productId,
    },
    { skip: !productId || !isOpen },
  )

  const onOpenVersionUpload = useCallback<VersionUploadContextType['onOpenVersionUpload']>(
    ({ productId, folderId }) => {
      setProductId(productId || '')
      setFolderId(folderId || '')
      setIsOpen(true)
    },
    [],
  )

  const onCloseVersionUpload = useCallback<VersionUploadContextType['onCloseVersionUpload']>(() => {
    setIsOpen(false)
    setProductId('')
    setFolderId('')
  }, [])

  const [createProduct] = useCreateProductMutation()
  const [createVersion] = useCreateVersionMutation()

  const onUploadVersion = useCallback<VersionUploadContextType['onUploadVersion']>(
    async (data: FormData) => {
      console.log('Uploading version with data:', data)
      try {
        if (version && productId) {
          // product already exists, create new version for it
          createVersion({
            projectName,
            versionPostModel: {
              productId,
              version: data.version,
            },
          }).unwrap()
        } else {
          // product does not exist, create new product with version
          const productRes = await createProduct({
            projectName,
            productPostModel: {
              folderId,
              name: data.name,
              productType: data.productType,
            },
          }).unwrap()

          // Now create the version for the newly created product
          await createVersion({
            projectName,
            versionPostModel: {
              productId: productRes.id,
              version: data.version,
            },
          }).unwrap()
        }
      } catch (error: any) {
        // Handle error appropriately
        console.error('Error uploading version:', error)
        // reject
        throw error.data.details
      }
    },
    [onCloseVersionUpload, productId, folderId, version, projectName],
  )

  const value = useMemo(
    () => ({
      productId,
      setProductId,
      folderId,
      setFolderId,
      isOpen,
      setIsOpen,
      projectName,
      version: productId ? version : undefined,
      onOpenVersionUpload,
      onCloseVersionUpload,
      onUploadVersion,
    }),
    [
      folderId,
      setFolderId,
      productId,
      setProductId,
      isOpen,
      projectName,
      version,
      onOpenVersionUpload,
      onCloseVersionUpload,
      onUploadVersion,
    ],
  )

  return <VersionUploadContext.Provider value={value}>{children}</VersionUploadContext.Provider>
}

export const useVersionUploadContext = (): VersionUploadContextType => {
  const context = useContext(VersionUploadContext)
  if (context === undefined) {
    throw new Error('useVersionUploadContext must be used within a VersionUploadProvider')
  }
  return context
}
