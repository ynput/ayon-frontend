import {
  useCreateVersionMutation,
  useCreateProductMutation,
  useGetLatestProductVersionQuery,
  useGetVersionQuery,
} from '@shared/api'
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { extractVersionFromFilename } from '@shared/util'
import { toast } from 'react-toastify'
import {
  validateFormData as validateFormDataHelper,
  createProductAndVersion,
  createVersionHelper,
} from '@shared/util/versionUploadHelpers'

export interface FormData {
  version: number
  name: string
  productType: string
}
export interface LinkedTask {
  id: string
  name: string
  label?: string | null
  taskType: string
}

interface VersionUploadContextType {
  productId: string
  folderId: string
  taskId: string
  linkedTask: LinkedTask | null
  isLoadingTask: boolean
  setTaskId: (taskId: string) => void
  setLinkedTask: (task: LinkedTask | null) => void
  setProductId: (productId: string) => void
  setFolderId: (folderId: string) => void
  isOpen: boolean
  projectName: string
  latestVersion: number | undefined
  pendingFiles: Array<{ file: File; preview?: string }>
  setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; preview?: string }>>>
  extractAndSetVersionFromFiles: (files: File[]) => void
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  isSubmitting: boolean
  error: string
  createdProductId: string | null
  createdVersionId: string | null
  onOpenVersionUpload: (params: {
    productId?: string
    folderId?: string
    taskId?: string
    linkedTask?: LinkedTask
    latestVersionNumber?: number
    latestVersionId?: string
  }) => void
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
  // optional task to link the version to
  // null = not set by user (auto-resolve from version), '' = explicitly cleared, 'id' = explicitly set
  const [userTaskId, setUserTaskId] = useState<string | null>(null)
  const [linkedTask, setLinkedTask] = useState<LinkedTask | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview?: string }>>([])
  const [form, setForm] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null)
  // Stores the latest version number passed from the caller (e.g. VP page)
  // so we can skip the GetLatestProductVersion query when we already know it
  const [latestVersionNumber, setLatestVersionNumber] = useState<number | undefined>(undefined)
  // Stores the latest version ID so we can fetch its task when not already known
  const [latestVersionId, setLatestVersionId] = useState<string | undefined>(undefined)

  const { currentData: version } = useGetLatestProductVersionQuery(
    {
      projectName,
      productId,
    },
    { skip: !productId || !isOpen || latestVersionNumber != null },
  )

  // Fetch the latest version to discover its taskId (e.g. when versions are collapsed)
  const { data: latestVersionData } = useGetVersionQuery(
    { projectName, versionId: latestVersionId! },
    { skip: !latestVersionId || !isOpen || userTaskId !== null },
  )

  // Derive effective taskId: user's explicit choice takes priority, then auto-resolved from version
  const taskId = userTaskId ?? latestVersionData?.taskId ?? ''
  const isLoadingTask = !!(latestVersionId && userTaskId === null && !latestVersionData)

  const onOpenVersionUpload = useCallback<VersionUploadContextType['onOpenVersionUpload']>(
    ({ productId, folderId, taskId, linkedTask, latestVersionNumber, latestVersionId }) => {
      setProductId(productId || '')
      setFolderId(folderId || '')
      setUserTaskId(taskId || null)
      setLinkedTask(linkedTask || null)
      setLatestVersionNumber(latestVersionNumber)
      setLatestVersionId(latestVersionId)

      // If we already know the latest version number, set the form immediately
      if (latestVersionNumber != null) {
        setForm((prev) => ({ ...prev, version: latestVersionNumber + 1 }))
      }
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
    setUserTaskId(null)
    setLinkedTask(null)
    setLatestVersionNumber(undefined)
    setLatestVersionId(undefined)
  }, [pendingFiles])

  const [createProduct] = useCreateProductMutation()
  const [createVersion] = useCreateVersionMutation()

  const onUploadVersion = useCallback<VersionUploadContextType['onUploadVersion']>(
    async (data: FormData) => {
      try {
        if (productId) {
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
              productBaseType: data.productType || 'review',
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
    [onCloseVersionUpload, productId, folderId, taskId, projectName],
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

  const latestVersion = version?.version ?? latestVersionNumber

  // Handle form changes
  const handleFormChange = useCallback((key: keyof FormData, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const validateFormData = () => {
    const validation = validateFormDataHelper(form, latestVersion, !productId)
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

  // Update form when version data changes (only when query is used as fallback)
  useEffect(() => {
    if (!isOpen || latestVersionNumber != null) return

    if (version) {
      setForm((prev) => ({ ...prev, version: version.version + 1 }))
    } else {
      setForm(defaultFormData)
    }

    return () => {
      setForm(defaultFormData)
    }
  }, [isOpen, version, latestVersionNumber])

  // Wrap setUserTaskId so consumers use a simple string setter
  const setTaskId = useCallback((id: string) => setUserTaskId(id), [])

  const value = useMemo(
    () => ({
      productId,
      setProductId,
      folderId,
      taskId,
      linkedTask,
      isLoadingTask,
      setTaskId,
      setLinkedTask,
      setFolderId,
      isOpen,
      projectName,
      latestVersion,
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
      linkedTask,
      isLoadingTask,
      setTaskId,
      setLinkedTask,
      setProductId,
      isOpen,
      projectName,
      latestVersion,
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
