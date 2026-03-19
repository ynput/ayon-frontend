import { Button, DialogProps } from "@ynput/ayon-react-components";
import { useCallback, useState } from "react";
import UploadStep from "./steps/UploadStep/UploadStep";
import { DialogContainer, DialogHeading, ImportContextWrapper } from "./ImportDialog.styled";
import { ImportData } from "./utils";
import MapColumnsStep from "./steps/MapColumnsStep/MapColumnsStep";
import { ImportContext, ImportStep, ResolvedColumnMappings, ValueMappings } from "./steps/common";
import { upperFirst } from "lodash";
import ReviewValuesStep from "./steps/ReviewValuesStep/ReviewValuesStep";
import testImportSchema from "./steps/test_import_schema";
import PreviewStep from "./steps/PreviewStep/PreviewStep";

type Props = {
  importContext: ImportContext
}

const dialogHeaderForStep: Record<ImportStep, string> = {
  [ImportStep.UPLOAD]: "Upload file",
  [ImportStep.MAP_COLUMNS]: "Map Columns",
  [ImportStep.REVIEW_VALUES]: "Review Values",
  [ImportStep.PREVIEW]: "Preview Result",
}
const dialogSizeForStep: Record<ImportStep, DialogProps["size"]> = {
  [ImportStep.UPLOAD]: "lg",
  [ImportStep.MAP_COLUMNS]: "full",
  [ImportStep.REVIEW_VALUES]: "full",
  [ImportStep.PREVIEW]: "full",
}

export default function ImportDialog({ importContext }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>(ImportStep.UPLOAD)
  const [data, setData] = useState<ImportData | null>(null)
  const [columnMappings, setColumnMappings] = useState<ResolvedColumnMappings | undefined>(undefined)
  const [valueMappings, setValueMappings] = useState<ValueMappings | null>(null)

  // TODO: get this from the API
  const importSchema = testImportSchema

  const closeDialog = useCallback(() => {
    setOpen(false)
    setStep(ImportStep.UPLOAD)
    setData(null)
    setColumnMappings(undefined)
  }, [])

  return (
    <>
      <Button
        icon="upload_file"
        label="Import CSV"
        onClick={() => setOpen(true)}
      />
      <DialogContainer
        isOpen={open}
        onClose={closeDialog}
        size={dialogSizeForStep[step]}
        header={(
          <DialogHeading>
            {dialogHeaderForStep[step]}
            <ImportContextWrapper>
              {upperFirst(importContext)}
              {
                data
                  ? ` - ${data.fileName}`
                  : ''
              }
            </ImportContextWrapper>
          </DialogHeading>
        )}
      >
        {
          step === ImportStep.UPLOAD && (
            <UploadStep
              importContext={importContext}
              onBack={closeDialog}
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
      </DialogContainer>
    </>
  )
}
