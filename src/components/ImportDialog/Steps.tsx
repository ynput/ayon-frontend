import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import UploadStep from "./steps/UploadStep/UploadStep";
import { getFullMapping, ImportData } from "./utils";
import MapColumnsStep from "./steps/MapColumnsStep/MapColumnsStep";
import { ColumnMappings, ImportContext, ImportStep, ValueMappings } from "./steps/common";
import ReviewValuesStep from "./steps/ReviewValuesStep/ReviewValuesStep";
import PreviewStep from "./steps/PreviewStep/PreviewStep";
import { useViewsContext } from "@shared/containers";
import { useExportFieldsQuery, useImportDataMutation } from "@queries/dataImport";
import { ColumnMapping, ImportStatus } from "@shared/api/generated/dataImport";
import { toast } from "react-toastify";
import { Breadcrumb, BreadcrumbButton, Breadcrumbs } from "./ImportDialog.styled";
import Loading from "./steps/Loading";
import { EmptyPlaceholder } from "@shared/components";
import { withHierarchySchema } from "./steps/hierarchy";

type Props = {
  importContext: ImportContext
  projectName?: string
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
]

const breadcrumbForStep: Record<ImportStep, string> = {
  [ImportStep.UPLOAD]: "Upload file",
  [ImportStep.MAP_COLUMNS]: "Map columns",
  [ImportStep.REVIEW_VALUES]: "Review values",
  [ImportStep.PREVIEW]: "Preview Result",
}

export default function ImportSteps({ importContext, projectName, data, setData, step, setStep, onClose }: Props) {
  const [importData] = useImportDataMutation()

  const [columnMappings, setColumnMappings] = useState<ColumnMappings | undefined>(undefined)
  const [valueMappings, setValueMappings] = useState<ValueMappings | null>(null)
  const [previewStatus, setPreviewStatus] = useState<ImportStatus | null>(null)

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
      importType: importContext,
      columnMapping,
      preview,
      projectName,
    })
  }, [data, projectName, importContext])

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

    requestImport(
      getFullMapping(columnMappings, valueMappings),
      false,
    ).then(() => {
      toast.success(`Import successful`)
      onClose()
    }).catch((err) => {
      console.error(err)
      toast.error(`Error importing data`)
    })
  }, [requestImport, columnMappings, valueMappings])

  const unlocked: Record<ImportStep, boolean> = useMemo(() => ({
    [ImportStep.UPLOAD]: Boolean(importSchema),
    [ImportStep.MAP_COLUMNS]: Boolean(importSchema && data),
    [ImportStep.REVIEW_VALUES]: Boolean(importSchema && data && columnMappings),
    [ImportStep.PREVIEW]: Boolean(importSchema && data && columnMappings && valueMappings && previewStatus),
  }), [importSchema, data, columnMappings, valueMappings, previewStatus])

  const completed: Record<ImportStep, boolean> = useMemo(() => ({
    [ImportStep.UPLOAD]: Boolean(importSchema && data),
    [ImportStep.MAP_COLUMNS]: Boolean(importSchema && data && columnMappings),
    [ImportStep.REVIEW_VALUES]: Boolean(importSchema && data && columnMappings && valueMappings && previewStatus),
    [ImportStep.PREVIEW]: false,
  }), [importSchema, data, columnMappings, valueMappings, previewStatus])

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
        importSchema && data && columnMappings && valueMappings && previewStatus && step === ImportStep.PREVIEW && (
          <PreviewStep
            data={data}
            previewStatus={previewStatus}
            importContext={importContext}
            onBack={() => setStep(ImportStep.REVIEW_VALUES)}
            onNext={onConfirmImport}
          />
        )
      }
    </>
  )
}
