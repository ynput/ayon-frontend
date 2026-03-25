import { Dispatch, SetStateAction, useEffect, useState } from "react";
import UploadStep from "./steps/UploadStep/UploadStep";
import { ImportData } from "./utils";
import MapColumnsStep from "./steps/MapColumnsStep/MapColumnsStep";
import { ImportContext, ImportStep, ResolvedColumnMappings, ValueMappings } from "./steps/common";
import ReviewValuesStep from "./steps/ReviewValuesStep/ReviewValuesStep";
import PreviewStep from "./steps/PreviewStep/PreviewStep";
import { useViewsContext } from "@shared/containers";
import { useExportFieldsQuery } from "@queries/dataImport";
import { useProjectContext } from "@shared/context";

type Props = {
  importContext: ImportContext
  data: ImportData | null
  setData: Dispatch<SetStateAction<ImportData | null>>
  step: ImportStep
  setStep: Dispatch<SetStateAction<ImportStep>>
  onClose: () => void
}

export default function ImportSteps({ importContext, data, setData, step, setStep, onClose }: Props) {
  const { projectName } = useProjectContext()

  const [columnMappings, setColumnMappings] = useState<ResolvedColumnMappings | undefined>(undefined)
  const [valueMappings, setValueMappings] = useState<ValueMappings | null>(null)

  const { data: importSchema } = useExportFieldsQuery({
    projectName,
    entityType: importContext,
  })

  const { setSelectedView, workingView } = useViewsContext()

  useEffect(() => {
    if (!workingView?.id) return
    setSelectedView(workingView.id)
  }, [workingView])

  return (
    <>
      {
        step === ImportStep.UPLOAD && (
          <UploadStep
            importContext={importContext}
            onBack={onClose}
            onNext={(d) => {
              setData(d)
              setStep(ImportStep.MAP_COLUMNS)
            }}
          />
        )
      }
      {
        step > ImportStep.UPLOAD && !importSchema && (
          <h2>Loading</h2>
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
            mappings={valueMappings}
            importContext={importContext}
            importSchema={importSchema}
            onBack={(mappings) => {
              setValueMappings(mappings ?? null)
              setStep(ImportStep.MAP_COLUMNS)
            }}
            onNext={(mappings) => {
              setValueMappings(mappings)
              setStep(ImportStep.PREVIEW)
            }}
          />
        )
      }
      {
        importSchema && data && columnMappings && valueMappings && step === ImportStep.PREVIEW && (
          <PreviewStep
            data={data}
            columnMappings={columnMappings}
            mappings={valueMappings}
            importContext={importContext}
            onBack={() => setStep(ImportStep.REVIEW_VALUES)}
            onNext={() => {}}
          />
        )
      }
    </>
  )
}
