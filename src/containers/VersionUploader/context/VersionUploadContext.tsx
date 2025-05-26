import {
  GetLatestVersionResult,
  useCreateVersionMutation,
  useGetLatestProductVersionQuery,
} from '@queries/versions/uploadVersions'
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { useCreateProductMutation } from '@queries/product/createProduct'
import { useAppDispatch } from '@state/store'
import { productSelected } from '@state/context'
import { extractVersionFromFilename } from '@shared/utils/extractVersionFromFilename'
import { productTypes } from '@shared/util'

export interface FormData {
  version: number
  name: string
  productType: string
}
interface VersionUploadContextType {
  productId: string
  folderId: string
  setProductId: (productId: string) => void
  setFolderId: (folderId: string) => void
  isOpen: boolean
  projectName: string
  version: GetLatestVersionResult | undefined
  pendingFiles: Array<{ file: File; preview?: string }>
  setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; preview?: string }>>>
  extractAndSetVersionFromFiles: (files: File[]) => void
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  isSubmitting: boolean
  error: string
  createdProductId: string | null
  createdVersionId: string | null
  onOpenVersionUpload: (params: { productId?: string; folderId?: string }) => void
  onCloseVersionUpload: () => void
  onUploadVersion: (data: FormData) => Promise<{ productId: string; versionId: string }>
  handleFormChange: (key: keyof FormData, value: string | number) => void
  handleFormSubmit: (formData: FormData) => Promise<void>
}

const VersionUploadContext = createContext<VersionUploadContextType | undefined>(undefined)

interface VersionUploadProviderProps {
  children: ReactNode
  projectName: string
}

const defaultFormData: FormData = {
  version: 1,
  name: productTypes.render.name,
  productType: 'render',
}

export const VersionUploadProvider: React.FC<VersionUploadProviderProps> = ({
  children,
  projectName,
}) => {
  const [folderId, setFolderId] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview?: string }>>([])
  const [form, setForm] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null)

  const { currentData: version } = useGetLatestProductVersionQuery(
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
    setForm(defaultFormData)
    setCreatedProductId(null)
    setCreatedVersionId(null)
    setError('')
    setIsSubmitting(false)
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
        if (extractedVersion && extractedVersion !== form.version) {
          setForm((prev) => ({
            ...prev,
            version: extractedVersion,
          }))
        }
      }
    },
    [productId, form.version],
  )

  // Handle form changes
  const handleFormChange = useCallback((key: keyof FormData, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const validateFormData = () => {
    // check version
    if (form.version < 1) throw 'Version must be greater than 0'
    if (version && form.version <= version.version) {
      throw `Version must be greater than ${version.version}`
    }
    // check product
    if (!version) {
      //  check name
      if (!form.name || form.name.trim() === '') {
        throw 'Name is required'
      }
      // check name regex
      const nameRegex = /^[a-zA-Z0-9_]([a-zA-Z0-9_\\.\\-]*[a-zA-Z0-9_])?$/
      if (!nameRegex.test(form.name)) {
        throw 'Product name can only contain alphanumeric characters, underscores, dots, and dashes, and must not start or end with a dot or dash'
      }
      // check productType
      if (!form.productType || !Object.keys(productTypes).includes(form.productType)) {
        throw 'Product type is required and must be a valid product type'
      }
    }
  }

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (formData: FormData) => {
      try {
        setIsSubmitting(true)
        setError('')

        // validate the form data
        validateFormData()

        const response = await onUploadVersion(formData)

        // Extract productId and versionId from response
        if (response?.productId) {
          setCreatedProductId(response.productId)
        }
        if (response?.versionId) {
          setCreatedVersionId(response.versionId)
        }

        if (pendingFiles.length < 1) {
          setIsSubmitting(false)
          onCloseVersionUpload()
        }
      } catch (error: any) {
        setError(error)
        setIsSubmitting(false)
      }
    },
    [onUploadVersion, pendingFiles.length, onCloseVersionUpload],
  )

  // Update form when version data changes
  useEffect(() => {
    if (!isOpen) return

    if (version) {
      setForm({
        ...defaultFormData,
        version: version.version + 1,
      })
    } else {
      setForm(defaultFormData)
    }

    return () => {
      setForm(defaultFormData)
    }
  }, [isOpen, version])

  const value = useMemo(
    () => ({
      productId,
      setProductId,
      folderId,
      setFolderId,
      isOpen,
      projectName,
      version: productId ? version : undefined,
      pendingFiles,
      setPendingFiles,
      onOpenVersionUpload,
      onCloseVersionUpload,
      onUploadVersion,
      extractAndSetVersionFromFiles,
      form,
      setForm,
      isSubmitting,
      error,
      createdProductId,
      createdVersionId,
      handleFormChange,
      handleFormSubmit,
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
      form,
      isSubmitting,
      error,
      createdProductId,
      createdVersionId,
      handleFormChange,
      handleFormSubmit,
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
