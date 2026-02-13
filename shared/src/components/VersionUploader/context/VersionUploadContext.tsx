import {
  GetLatestVersionResult,
  useCreateVersionMutation,
  useGetLatestProductVersionQuery,
} from '@shared/api'
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { useCreateProductMutation } from '@shared/api'
import { extractVersionFromFilename } from '@shared/util'
import { toast } from 'react-toastify'
import {
  validateFormData as validateFormDataHelper,
  createProductAndVersion,
  createVersionHelper,
  handleUploadError,
  getNextVersionNumber,
  type ProductCreationData,
  type VersionCreationData,
} from '@shared/util/versionUploadHelpers'

export interface FormData {
  version: number
  name: string
  productType: string
}
interface VersionUploadContextType {
  productId: string
  folderId: string
  taskId: string
  setTaskId: (taskId: string) => void
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
  onOpenVersionUpload: (params: { productId?: string; folderId?: string; taskId?: string }) => void
  onCloseVersionUpload: () => void
  onUploadVersion: (data: FormData) => Promise<{ productId: string; versionId: string }>
  handleFormChange: (key: keyof FormData, value: string | number) => void
  handleFormSubmit: (formData: FormData) => Promise<void>
  // pass through
  dispatch: any
}

const VersionUploadContext = createContext<VersionUploadContextType | undefined>(undefined)

interface VersionUploadProviderProps {
  children: ReactNode
  projectName: string
  onVersionCreated: (productId: string, versionId: string) => void
  dispatch: any
}

const defaultFormData: FormData = {
  version: 1,
  name: 'review',
  productType: 'review',
}

export const VersionUploadProvider: React.FC<VersionUploadProviderProps> = ({
  children,
  projectName,
  onVersionCreated,
  dispatch,
}) => {
  const [folderId, setFolderId] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  // optional taskId to link the version to
  const [taskId, setTaskId] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview?: string }>>([])
  const [form, setForm] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null)
  // Track whether taskId has been prefilled this session to avoid re-prefilling after user clears it
  const hasPrefilledTaskRef = useRef(false)

  const { currentData: version } = useGetLatestProductVersionQuery(
    {
      projectName,
      productId,
    },
    { skip: !productId || !isOpen },
  )

  const onOpenVersionUpload = useCallback<VersionUploadContextType['onOpenVersionUpload']>(
    ({ productId, folderId, taskId }) => {
      setProductId(productId || '')
      setFolderId(folderId || '')
      setTaskId(taskId || '')
      hasPrefilledTaskRef.current = !!taskId
      setIsOpen(true)
    },
    [],
  )

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
    setTaskId('')
    hasPrefilledTaskRef.current = false
  }, [pendingFiles])

  const [createProduct] = useCreateProductMutation()
  const [createVersion] = useCreateVersionMutation()

  const onUploadVersion = useCallback<VersionUploadContextType['onUploadVersion']>(
    async (data: FormData) => {
      console.log('Uploading version with data:', data)
      try {
        if (version && productId) {
          // product already exists, create new version for it
          const versionRes = await createVersionHelper(createVersion, projectName, {
            productId,
            version: data.version,
            taskId: taskId || undefined,
          })

          // select the new version
          onVersionCreated(productId, versionRes.id)

          return {
            productId,
            versionId: versionRes.id,
          }
        } else {
          // product does not exist, create new product with version
          const { product: productRes, version: versionRes } = await createProductAndVersion(
            createProduct,
            createVersion,
            projectName,
            {
              folderId,
              name: data.name,
              productType: data.productType || 'review',
            },
            {
              version: data.version,
              taskId: taskId || undefined,
            },
          )

          // select the new product and version
          onVersionCreated(productRes.id, versionRes.id)

          toast.success('Created new version')

          return {
            productId: productRes.id,
            versionId: versionRes.id,
          }
        }
      } catch (error: any) {
        console.error('Error uploading version:', error)
        throw error.message || error
      }
    },
    [onCloseVersionUpload, productId, folderId, taskId, version, projectName],
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
    const validation = validateFormDataHelper(form, version?.version, !version)
    if (!validation.isValid) {
      throw validation.error
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
        version: getNextVersionNumber(version),
      })
      // Auto-prefill taskId from previous version (only once per dialog session)
      if (!hasPrefilledTaskRef.current && version.taskId) {
        setTaskId(version.taskId)
        hasPrefilledTaskRef.current = true
      }
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
      taskId,
      setTaskId,
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
      dispatch,
    }),
    [
      folderId,
      setFolderId,
      productId,
      taskId,
      setTaskId,
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
      dispatch,
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
