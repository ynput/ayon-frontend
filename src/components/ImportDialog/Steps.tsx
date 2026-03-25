import { Dispatch, SetStateAction, useEffect, useState } from "react";
import UploadStep from "./steps/UploadStep/UploadStep";
import { ImportData } from "./utils";
import MapColumnsStep from "./steps/MapColumnsStep/MapColumnsStep";
import { ImportContext, ImportStep, ResolvedColumnMappings, ValueMappings } from "./steps/common";
import ReviewValuesStep from "./steps/ReviewValuesStep/ReviewValuesStep";
import testImportSchema from "./steps/test_import_schema";
import PreviewStep from "./steps/PreviewStep/PreviewStep";
import { useViewsContext } from "@shared/containers";

type Props = {
  importContext: ImportContext
  data: ImportData | null
  setData: Dispatch<SetStateAction<ImportData | null>>
  step: ImportStep
  setStep: Dispatch<SetStateAction<ImportStep>>
  onClose: () => void
}

export default function ImportSteps({ importContext, data, setData, step, setStep, onClose }: Props) {
  const [columnMappings, setColumnMappings] = useState<ResolvedColumnMappings | undefined>(undefined)
  const [valueMappings, setValueMappings] = useState<ValueMappings | null>(null)

  // TODO: get this from the API
  const importSchema = testImportSchema

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
        data && step === ImportStep.MAP_COLUMNS && (
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
        data && columnMappings && step === ImportStep.REVIEW_VALUES && (
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
        data && columnMappings && valueMappings && step === ImportStep.PREVIEW && (
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
