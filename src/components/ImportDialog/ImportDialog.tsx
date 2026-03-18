import { Button, Dialog } from "@ynput/ayon-react-components";
import { useState } from "react";
import UploadStep from "./steps/UploadStep";
import { DialogHeading, ImportContextWrapper } from "./ImportDialog.styled";
import { ImportData } from "./utils";
import MapColumnsStep from "./steps/MapColumnsStep";
import { ColumnMappings, ImportContext, ImportStep } from "./steps/common";
import { upperFirst } from "lodash";

type Props = {
  importContext: ImportContext
}

const dialogHeaderForStep: Record<ImportStep, string> = {
  [ImportStep.UPLOAD]: "Upload file",
  [ImportStep.MAP_COLUMNS]: "Map Columns",
  [ImportStep.REVIEW_VALUES]: "Review Values",
  [ImportStep.PREVIEW]: "Preview Result",
}

export default function ImportDialog({ importContext }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>(ImportStep.UPLOAD)
  const [data, setData] = useState<ImportData | null>(null)
  const [columnMappings, setColumnMappings] = useState<ColumnMappings | null>(null)

  return (
    <>
      <Button
        icon="upload_file"
        label="Import CSV"
        onClick={() => setOpen(true)}
      />
      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        size="lg"
        header={(
          <DialogHeading>
            {dialogHeaderForStep[step]}
            <ImportContextWrapper>{upperFirst(importContext)}</ImportContextWrapper>
          </DialogHeading>
        )}
      >
        {
          step === ImportStep.UPLOAD && (
            <UploadStep
              importContext={importContext}
              onBack={() => setOpen(false)}
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
              importContext={importContext}
              onBack={() => setStep(ImportStep.UPLOAD)}
              onNext={(mappings) => {
                setColumnMappings(mappings)
                setStep(ImportStep.REVIEW_VALUES)
              }}
            />
          )
        }
      </Dialog>
    </>
  )
}
