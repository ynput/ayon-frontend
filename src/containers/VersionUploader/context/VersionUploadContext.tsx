import {
  GetLatestVersionResult,
  useCreateVersionMutation,
  useGetLatestProductVersionQuery,
} from '@queries/versions/uploadVersions'
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'
import { FormData } from '../components/UploadVersionDialog'
import { useCreateProductMutation } from '@queries/product/createProduct'
import { useAppDispatch } from '@state/store'
import { productSelected } from '@state/context'
import { extractVersionFromFilename } from '@shared/utils/extractVersionFromFilename'

interface VersionUploadContextType {
  productId: string
  folderId: string
  setProductId: (productId: string) => void
  setFolderId: (folderId: string) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  projectName: string
  version: GetLatestVersionResult | undefined
  pendingFiles: Array<{ file: File; preview?: string }>
  setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; preview?: string }>>>
  extractAndSetVersionFromFiles: (files: File[]) => void
  suggestedVersion: number | null
  onOpenVersionUpload: (params: { productId?: string; folderId?: string }) => void
  onCloseVersionUpload: () => void
  onUploadVersion: (data: FormData) => Promise<{ productId: string; versionId: string }>
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
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview?: string }>>([])
  const [suggestedVersion, setSuggestedVersion] = useState<number | null>(null)

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

  const dispatch = useAppDispatch()

  const selectNewVersion = (productId: string, versionId: string) => {
    // set selected product
    dispatch(productSelected({ products: [productId], versions: [versionId] }))
  }

  const onCloseVersionUpload = useCallback<VersionUploadContextType['onCloseVersionUpload']>(() => {
    // Clean up pending files
    pendingFiles.forEach((item) => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview)
      }
    })
    setPendingFiles([])
    setSuggestedVersion(null)
    setIsOpen(false)
    setProductId('')
    setFolderId('')
  }, [pendingFiles])

  const [createProduct] = useCreateProductMutation()
  const [createVersion] = useCreateVersionMutation()

  const onUploadVersion = useCallback<VersionUploadContextType['onUploadVersion']>(
    async (data: FormData) => {
      console.log('Uploading version with data:', data)
      try {
        if (version && productId) {
          // product already exists, create new version for it
          const versionRes = await createVersion({
            projectName,
            versionPostModel: {
              productId,
              version: data.version,
            },
          }).unwrap()

          // select the new version
          selectNewVersion(productId, versionRes.id)

          return {
            productId,
            versionId: versionRes.id,
          }
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
          const versionRes = await createVersion({
            projectName,
            versionPostModel: {
              productId: productRes.id,
              version: data.version,
            },
          }).unwrap()

          // select the new product and version
          selectNewVersion(productRes.id, versionRes.id)

          return {
            productId: productRes.id,
            versionId: versionRes.id,
          }
        }
      } catch (error: any) {
        // Handle error appropriately
        console.error('Error uploading version:', error)
        // reject
        throw error.data.detail
      }
    },
    [onCloseVersionUpload, productId, folderId, version, projectName],
  )

  const extractAndSetVersionFromFiles = useCallback(
    (files: File[]) => {
      // Only extract version if we don't already have a product (new product workflow)
      if (productId) return

      // Try to extract version from the first file
      const firstFile = files[0]
      if (firstFile) {
        const extractedVersion = extractVersionFromFilename(firstFile.name)
        if (extractedVersion && extractedVersion !== suggestedVersion) {
          setSuggestedVersion(extractedVersion)
        }
      }
    },
    [productId, suggestedVersion],
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
      pendingFiles,
      setPendingFiles,
      onOpenVersionUpload,
      onCloseVersionUpload,
      onUploadVersion,
      extractAndSetVersionFromFiles,
      suggestedVersion,
    }),
    [
      folderId,
      setFolderId,
      productId,
      setProductId,
      isOpen,
      projectName,
      version,
      pendingFiles,
      setPendingFiles,
      onOpenVersionUpload,
      onCloseVersionUpload,
      onUploadVersion,
      extractAndSetVersionFromFiles,
      suggestedVersion,
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
