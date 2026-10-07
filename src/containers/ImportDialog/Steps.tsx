import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import UploadStep from './steps/UploadStep/UploadStep'
import { getFullMapping, ImportData } from './utils'
import MapColumnsStep from './steps/MapColumnsStep/MapColumnsStep'
import {
  ColumnAction,
  ColumnMappings,
  ImportContext,
  ImportStep,
  ValueMappings,
} from './steps/common'
import ReviewValuesStep from './steps/ReviewValuesStep/ReviewValuesStep'
import PreviewStep from './steps/PreviewStep/PreviewStep'
import { useViewsContext } from '@shared/containers'
import {
  ColumnMapping,
  DuplicateItemStrategy,
  ImportStatus,
} from '@shared/api/generated/dataImport'
import { toast } from 'react-toastify'
import { getRequestErrorString } from '@shared/util'
import { useExportFieldsQuery, useImportDataMutation } from '../../services/dataImport'
import { Breadcrumb, BreadcrumbButton, Breadcrumbs } from './ImportDialog.styled'
import Loading from './steps/Loading'
import { EmptyPlaceholder } from '@shared/components'
import { withHierarchySchema } from './steps/hierarchy'
import SubmitStep from './steps/SubmitStep/SubmitStep'
import ImportOptions from './steps/ImportOptions/ImportOptions'
import {
  getUnmappedRequiredTargetGroups,
  hasImportModes,
  ImportMode,
  missingStrategyForImportMode,
  RowsEntityType,
  schemaForRowsEntityType,
} from './steps/importMode'

type Props = {
  importContext: ImportContext
  projectName?: string
  folderId?: string
  data: ImportData | null
  setData: Dispatch<SetStateAction<ImportData | null>>
  step: ImportStep
  setStep: Dispatch<SetStateAction<ImportStep>>
  onClose: () => void
}

const steps = [
  ImportStep.UPLOAD,
  ImportStep.MAP_COLUMNS,
  ImportStep.REVIEW_VALUES,
  ImportStep.PREVIEW,
  ImportStep.SUBMIT,
]

const breadcrumbForStep: Record<ImportStep, string> = {
  [ImportStep.UPLOAD]: 'Upload file',
  [ImportStep.MAP_COLUMNS]: 'Map columns',
  [ImportStep.REVIEW_VALUES]: 'Review values',
  [ImportStep.PREVIEW]: 'Preview result',
  [ImportStep.SUBMIT]: 'Import data',
}

export default function ImportSteps({
  importContext,
  projectName,
  folderId,
  data,
  setData,
  step,
  setStep,
  onClose,
}: Props) {
  const [importData] = useImportDataMutation()

  const [importMode, setImportMode] = useState(ImportMode.CREATE_AND_UPDATE)
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateItemStrategy>('skip')
  const [rowsEntityType, setRowsEntityType] = useState<RowsEntityType>('column')
  const [columnMappings, setColumnMappings] = useState<ColumnMappings | undefined>(undefined)
  const [valueMappings, setValueMappings] = useState<ValueMappings | null>(null)
  const [previewStatus, setPreviewStatus] = useState<ImportStatus | null>(null)
  // the response is the result, the import.data events only show progress
  const [importResult, setImportResult] = useState<ImportStatus | null>(null)
  const [requestError, setRequestError] = useState<unknown>(null)
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    data: rawImportSchema,
    isLoading: importSchemaLoading,
    isError: importSchemaError,
  } = useExportFieldsQuery(
    {
      projectName,
      entityType: importContext,
      folderId,
    },
    // statuses, list attributes and comment categories can change in settings meanwhile
    { refetchOnMountOrArgChange: true },
  )

  const importSchema = useMemo(() => {
    if (importContext !== 'hierarchy') {
      return rawImportSchema
    }

    const hierarchySchema = withHierarchySchema(rawImportSchema)
    return hierarchySchema && schemaForRowsEntityType(hierarchySchema, rowsEntityType)
  }, [rawImportSchema, importContext, rowsEntityType])

  const { setSelectedView, workingView } = useViewsContext()

  useEffect(() => {
    if (!workingView?.id) return
    setSelectedView(workingView.id)
  }, [workingView])

  const requestImport = useCallback(
    async (columnMapping: ColumnMapping[], preview: boolean) => {
      if (!data) return

      return importData({
        fileId: data.fileId,
        folderId,
        importType: importContext,
        columnMapping,
        preview,
        projectName,
        existingStrategy: 'update',
        missingStrategy: missingStrategyForImportMode[importMode],
        duplicateStrategy,
        entityType:
          importContext === 'hierarchy' && rowsEntityType !== 'column' ? rowsEntityType : undefined,
      })
    },
    [data, folderId, projectName, importContext, importMode, duplicateStrategy, rowsEntityType],
  )

  const changeImportMode = useCallback((mode: ImportMode) => {
    setImportMode(mode)
    setPreviewStatus(null)
  }, [])

  const fetchPreview = useCallback(() => {
    if (!columnMappings || !valueMappings) return

    setRequestError(null)
    requestImport(getFullMapping(columnMappings, valueMappings), true).then((result) => {
      if (!result) return
      if (result.error) {
        setRequestError(result.error)
        toast.error(`Error getting import preview: ${getRequestErrorString(result.error)}`)
        return
      }
      setPreviewStatus(result.data)
    })
  }, [requestImport, columnMappings, valueMappings])

  const onValuesReviewed = useCallback(() => {
    fetchPreview()
    setStep(ImportStep.PREVIEW)
  }, [requestImport, columnMappings, valueMappings])

  const onConfirmImport = useCallback(() => {
    if (!columnMappings || !valueMappings) return

    setSubmitted(true)
    setStep(ImportStep.SUBMIT)
    setImportResult(null)
    setRequestError(null)
    requestImport(getFullMapping(columnMappings, valueMappings), false).then((result) => {
      if (!result) return
      if (result.error) {
        setRequestError(result.error)
        toast.error(`Error importing data: ${getRequestErrorString(result.error)}`)
        return
      }
      setImportResult(result.data)
      setSuccess(true)
    })
  }, [requestImport, columnMappings, valueMappings])

  // the mode can change after the columns were mapped, so the mapping may no longer be enough
  // the options can change after the columns were mapped, so the mapping may no longer fit:
  // a required target may be missing or a target may no longer be offered
  const mappingsValid = useMemo(() => {
    if (!importSchema || !columnMappings) return false
    const targets = new Set(importSchema.map(({ key }) => key))
    const targetsOffered = Object.values(columnMappings).every(
      ({ action, targetColumn }) =>
        action !== ColumnAction.MAP || !targetColumn || targets.has(targetColumn),
    )
    return (
      targetsOffered &&
      getUnmappedRequiredTargetGroups(
        importContext,
        importMode,
        importSchema,
        columnMappings,
        folderId,
      ).length === 0
    )
  }, [importContext, importMode, importSchema, columnMappings, folderId])

  const unlocked: Record<ImportStep, boolean> = useMemo(
    () => ({
      [ImportStep.UPLOAD]: !submitted && Boolean(importSchema),
      [ImportStep.MAP_COLUMNS]: !submitted && Boolean(importSchema && data),
      [ImportStep.REVIEW_VALUES]: !submitted && Boolean(importSchema && data && mappingsValid),
      [ImportStep.PREVIEW]:
        !submitted &&
        Boolean(importSchema && data && mappingsValid && valueMappings && previewStatus),
      [ImportStep.SUBMIT]: Boolean(
        importSchema && data && columnMappings && valueMappings && previewStatus && submitted,
      ),
    }),
    [
      importSchema,
      data,
      columnMappings,
      mappingsValid,
      valueMappings,
      previewStatus,
      submitted,
      success,
    ],
  )

  const completed: Record<ImportStep, boolean> = useMemo(
    () => ({
      [ImportStep.UPLOAD]: Boolean(importSchema && data),
      [ImportStep.MAP_COLUMNS]: Boolean(importSchema && data && mappingsValid),
      [ImportStep.REVIEW_VALUES]: Boolean(
        importSchema && data && columnMappings && valueMappings && previewStatus,
      ),
      [ImportStep.PREVIEW]: Boolean(
        importSchema && data && columnMappings && valueMappings && previewStatus && submitted,
      ),
      [ImportStep.SUBMIT]: success,
    }),
    [
      importSchema,
      data,
      columnMappings,
      mappingsValid,
      valueMappings,
      previewStatus,
      submitted,
      success,
    ],
  )

  return (
    <>
      <Breadcrumbs>
        {steps.map((s, index) => (
          <Breadcrumb key={s}>
            <BreadcrumbButton
              variant="nav"
              label={`${index + 1}. ${breadcrumbForStep[s]}`}
              disabled={!unlocked[s]}
              icon={completed[s] ? 'check' : ''}
              iconProps={{
                style: {
                  color: completed[s] ? 'var(--md-sys-color-tertiary)' : 'inherit',
                },
              }}
              selected={step === s}
              onClick={() => {
                setStep(s)

                if (s === ImportStep.PREVIEW) {
                  fetchPreview()
                }
              }}
            />
          </Breadcrumb>
        ))}
      </Breadcrumbs>
      {importSchema &&
        hasImportModes(importContext) &&
        (step === ImportStep.UPLOAD || step === ImportStep.MAP_COLUMNS) && (
          <ImportOptions
            importContext={importContext}
            importMode={importMode}
            onImportModeChange={changeImportMode}
            rowsEntityType={rowsEntityType}
            onRowsEntityTypeChange={(entityType) => {
              setRowsEntityType(entityType)
              setPreviewStatus(null)
            }}
            duplicateStrategy={duplicateStrategy}
            onDuplicateStrategyChange={(strategy) => {
              setDuplicateStrategy(strategy)
              setPreviewStatus(null)
            }}
          />
        )}
      {!importSchema && importSchemaLoading && <Loading />}
      {!importSchema && !importSchemaLoading && <EmptyPlaceholder error={importSchemaError} />}
      {step === ImportStep.UPLOAD && importSchema && (
        <UploadStep
          importContext={importContext}
          importSchema={importSchema}
          uploaded={data}
          importMode={importMode}
          onBack={onClose}
          onNext={(d) => {
            // coming back to change the mode keeps the file and its mappings
            if (d.fileId !== data?.fileId) {
              setData(d)
              setColumnMappings(undefined)
              setValueMappings(null)
            }
            setPreviewStatus(null)
            setStep(ImportStep.MAP_COLUMNS)
          }}
        />
      )}
      {importSchema && data && step === ImportStep.MAP_COLUMNS && (
        <MapColumnsStep
          data={data}
          mappings={columnMappings}
          importContext={importContext}
          importMode={importMode}
          importSchema={importSchema}
          folderId={folderId}
          onImportModeChange={changeImportMode}
          onBack={() => setStep(ImportStep.UPLOAD)}
          onNext={(mappings) => {
            setColumnMappings(mappings)
            setStep(ImportStep.REVIEW_VALUES)
          }}
        />
      )}
      {importSchema && data && columnMappings && step === ImportStep.REVIEW_VALUES && (
        <ReviewValuesStep
          data={data}
          columnMappings={columnMappings}
          importContext={importContext}
          importSchema={importSchema}
          mappings={valueMappings}
          setMappings={setValueMappings}
          onBack={() => {
            setStep(ImportStep.MAP_COLUMNS)
          }}
          onNext={onValuesReviewed}
        />
      )}
      {importSchema && data && columnMappings && valueMappings && step === ImportStep.PREVIEW && (
        <PreviewStep
          data={data}
          previewStatus={previewStatus}
          error={requestError}
          importContext={importContext}
          importMode={importMode}
          onBack={() => setStep(ImportStep.REVIEW_VALUES)}
          onNext={onConfirmImport}
        />
      )}
      {importSchema &&
        data &&
        columnMappings &&
        valueMappings &&
        submitted &&
        step === ImportStep.SUBMIT && (
          <SubmitStep
            data={data}
            result={importResult}
            error={requestError}
            importContext={importContext}
            importMode={importMode}
            onBack={() => {}}
            onNext={onClose}
          />
        )}
    </>
  )
}
