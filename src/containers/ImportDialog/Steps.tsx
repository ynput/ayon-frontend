import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import UploadStep from "./steps/UploadStep/UploadStep";
import { getFullMapping, ImportData } from "./utils";
import MapColumnsStep from "./steps/MapColumnsStep/MapColumnsStep";
import { ColumnMappings, ImportContext, ImportStep, ValueMappings } from "./steps/common";
import ReviewValuesStep from "./steps/ReviewValuesStep/ReviewValuesStep";
import PreviewStep from "./steps/PreviewStep/PreviewStep";
import { useViewsContext } from "@shared/containers";
import { ColumnMapping, ImportStatus } from "@shared/api/generated/dataImport";
import { toast } from "react-toastify";
import { useExportFieldsQuery, useImportDataMutation } from "../../services/dataImport";
import { Breadcrumb, BreadcrumbButton, Breadcrumbs } from "./ImportDialog.styled";
import Loading from "./steps/Loading";
import { EmptyPlaceholder } from "@shared/components";
import { withHierarchySchema } from "./steps/hierarchy";
import SubmitStep from "./steps/SubmitStep/SubmitStep";

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
  [ImportStep.UPLOAD]: "Upload file",
  [ImportStep.MAP_COLUMNS]: "Map columns",
  [ImportStep.REVIEW_VALUES]: "Review values",
  [ImportStep.PREVIEW]: "Preview result",
  [ImportStep.SUBMIT]: "Import data",
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

  const [columnMappings, setColumnMappings] = useState<ColumnMappings | undefined>(undefined)
  const [valueMappings, setValueMappings] = useState<ValueMappings | null>(null)
  const [previewStatus, setPreviewStatus] = useState<ImportStatus | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    data: rawImportSchema,
    isLoading: importSchemaLoading,
    isError: importSchemaError,
  } = useExportFieldsQuery({
    projectName,
    entityType: importContext,
  })

  const importSchema = useMemo(() => {
    if (importContext !== "hierarchy") {
      return rawImportSchema
    }

    return withHierarchySchema(rawImportSchema)
  }, [rawImportSchema])

  const { setSelectedView, workingView } = useViewsContext()

  useEffect(() => {
    if (!workingView?.id) return
    setSelectedView(workingView.id)
  }, [workingView])

  const requestImport = useCallback(async (columnMapping: ColumnMapping[], preview: boolean) => {
    if (!data) return

    return importData({
      fileId: data.fileId,
      folderId,
      importType: importContext,
      columnMapping,
      preview,
      projectName,
      existingStrategy: "update",
    })
  }, [data, folderId, projectName, importContext])

  const fetchPreview = useCallback(() => {
    if (!columnMappings || !valueMappings) return

    requestImport(
      getFullMapping(columnMappings, valueMappings),
      true,
    ).then((result) => {
      if (!result || result.error) {
        throw new Error(JSON.stringify(result?.error))
      }

      setPreviewStatus(result.data)
    }).catch((err) => {
      console.error(err)
      toast.error(`Error getting import preview`)
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
    requestImport(
      getFullMapping(columnMappings, valueMappings),
      false,
    ).then(() => {
      setSuccess(true)
    }).catch((err) => {
      console.error(err)
      toast.error(`Error importing data`)
    })
  }, [requestImport, columnMappings, valueMappings])

  const unlocked: Record<ImportStep, boolean> = useMemo(() => ({
    [ImportStep.UPLOAD]: !submitted && Boolean(importSchema),
    [ImportStep.MAP_COLUMNS]: !submitted && Boolean(importSchema && data),
    [ImportStep.REVIEW_VALUES]: !submitted && Boolean(importSchema && data && columnMappings),
    [ImportStep.PREVIEW]: !submitted && Boolean(importSchema && data && columnMappings && valueMappings && previewStatus),
    [ImportStep.SUBMIT]: Boolean(importSchema && data && columnMappings && valueMappings && previewStatus && submitted),
  }), [importSchema, data, columnMappings, valueMappings, previewStatus, submitted, success])

  const completed: Record<ImportStep, boolean> = useMemo(() => ({
    [ImportStep.UPLOAD]: Boolean(importSchema && data),
    [ImportStep.MAP_COLUMNS]: Boolean(importSchema && data && columnMappings),
    [ImportStep.REVIEW_VALUES]: Boolean(importSchema && data && columnMappings && valueMappings && previewStatus),
    [ImportStep.PREVIEW]: Boolean(importSchema && data && columnMappings && valueMappings && previewStatus && submitted),
    [ImportStep.SUBMIT]: success,
  }), [importSchema, data, columnMappings, valueMappings, previewStatus, submitted, success])

  return (
    <>
      <Breadcrumbs>
        {
          steps.map((s, index) => (
            <Breadcrumb key={s}>
              <BreadcrumbButton
                variant="nav"
                label={`${index + 1}. ${breadcrumbForStep[s]}`}
                disabled={!unlocked[s]}
                icon={completed[s] ? "check" : ""}
                iconProps={{
                  style: {
                    color: completed[s]
                      ? "var(--md-sys-color-tertiary)"
                      : "inherit"
                  }
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
          ))
        }
      </Breadcrumbs>
      {
        !importSchema && importSchemaLoading && <Loading />
      }
      {
        !importSchema && !importSchemaLoading && <EmptyPlaceholder error={importSchemaError} />
      }
      {
        step === ImportStep.UPLOAD && importSchema && (
          <UploadStep
            importContext={importContext}
            importSchema={importSchema}
            onBack={onClose}
            onNext={(d) => {
              setData(d)
              setColumnMappings(undefined)
              setValueMappings(null)
              setPreviewStatus(null)
              setStep(ImportStep.MAP_COLUMNS)
            }}
          />
        )
      }
      {
        importSchema && data && step === ImportStep.MAP_COLUMNS && (
          <MapColumnsStep
            data={data}
            mappings={columnMappings}
            importContext={importContext}
            importSchema={importSchema}
            onBack={() => setStep(ImportStep.UPLOAD)}
            onNext={(mappings) => {
              setColumnMappings(mappings)
              setStep(ImportStep.REVIEW_VALUES)
            }}
          />
        )
      }
      {
        importSchema && data && columnMappings && step === ImportStep.REVIEW_VALUES && (
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
        )
      }
      {
        importSchema && data && columnMappings && valueMappings && step === ImportStep.PREVIEW && (
          <PreviewStep
            data={data}
            previewStatus={previewStatus}
            importContext={importContext}
            onBack={() => setStep(ImportStep.REVIEW_VALUES)}
            onNext={onConfirmImport}
          />
        )
      }
      {
        importSchema && data && columnMappings && valueMappings && submitted && step === ImportStep.SUBMIT && (
          <SubmitStep
            data={data}
            importContext={importContext}
            onBack={() => {}}
            onNext={onClose}
          />
        )
      }
    </>
  )
}
