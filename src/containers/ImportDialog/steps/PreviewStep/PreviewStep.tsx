import { getImportStatsItems, ImportContext, ImportDataMessage, ImportDataStartSummary, itemsLabelForImportContext, StepProps } from "../common";
import { Button, getFileSizeString } from "@ynput/ayon-react-components";
import { ProgressBar, StepContainer, StepNavButtons } from "../common.styled";
import { ImportData } from "../../utils";
import { ImportStatus } from "@shared/api/generated/dataImport";
import Stats from "../Stats";
import usePubSub from "@hooks/usePubSub";
import { useState } from "react";
import { ImportMode } from "../importMode";
import { EmptyPlaceholder } from "@shared/components";

type Props = StepProps<void> & {
  data: ImportData
  previewStatus: ImportStatus | null
  error?: unknown
  importContext: ImportContext
  importMode: ImportMode
}

export default function PreviewStep({ data, previewStatus, error, importContext, importMode, onBack, onNext }: Props) {
  const [previewProgress, setPreviewProgress] = useState(0)

  usePubSub(
    "import.data",
    (_: any, message: ImportDataMessage) => {
      if ((message.summary as ImportDataStartSummary).total) return

      setPreviewProgress(message.progress ?? 0)
    },
    null,
    { disableDebounce: true },
  )

  return (
    <>
      <StepContainer>
        {
          previewStatus && (
            <Stats
              heading={data.fileName}
              subtitle={importMode === ImportMode.UPDATE_ONLY
                ? `Updating existing ${itemsLabelForImportContext[importContext]}`
                : `Importing ${itemsLabelForImportContext[importContext]}`}
              size={getFileSizeString(data.fileSize)}
              items={getImportStatsItems(previewStatus, false)}
            />
          )
        }
        {
          !previewStatus && !!error && (
            <EmptyPlaceholder message="The import could not be validated" error={error} />
          )
        }
        {
          !previewStatus && !error && (
            <ProgressBar
              type="validating"
              name={data.fileName}
              progress={previewProgress}
            />
          )
        }
      </StepContainer>
      <StepNavButtons>
        <Button
          variant="nav"
          label="Back"
          onClick={() => onBack()}
        />
        <Button
          variant="filled"
          label="Import data"
          disabled={!previewStatus}
          onClick={() => {
            onNext()
          }}
        />
      </StepNavButtons>
    </>
  )
}
