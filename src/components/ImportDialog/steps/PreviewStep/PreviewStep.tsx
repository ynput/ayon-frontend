import { formatFailedItems, ImportContext, ImportDataMessage, ImportDataProcessSummary, ImportDataStartSummary, itemsLabelForImportContext, StepProps } from "../common";
import { Button, getFileSizeString } from "@ynput/ayon-react-components";
import { ProgressBar, StepContainer, StepNavButtons } from "../common.styled";
import { ImportData } from "@components/ImportDialog/utils";
import { ImportStatus } from "@shared/api/generated/dataImport";
import Stats from "../Stats";
import usePubSub from "@hooks/usePubSub";
import { useState } from "react";

type Props = StepProps<void> & {
  data: ImportData
  previewStatus: ImportStatus | null
  importContext: ImportContext
}

export default function PreviewStep({ data, previewStatus, importContext, onBack, onNext }: Props) {
  const [previewProgress, setPreviewProgress] = useState(0)

  usePubSub(
    "import.data",
    (_: any, message: ImportDataMessage) => {
      if ((message.summary as ImportDataStartSummary).total) return

      const processedCount = Object.values(message.summary as ImportDataProcessSummary)
        .reduce((a, i) => {
          if (typeof a !== "number") return 0
          if (typeof i !== "number") return a
          return a + i
        }, 0) as number

      setPreviewProgress(Math.round(processedCount / data.rows.length * 100))
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
              subtitle={`Importing ${itemsLabelForImportContext[importContext]}`}
              size={getFileSizeString(data.fileSize)}
              items={[
                {
                  text: `Creating: ${previewStatus.created}`,
                  icon: "add",
                },
                {
                  text: `Updating: ${previewStatus.updated}`,
                  icon: "difference",
                },
                {
                  text: `Skipping: ${previewStatus.skipped}`,
                  icon: "do_not_disturb",
                },
                {
                  text: `Errors: ${previewStatus.failed}`,
                  icon: "error",
                  danger: !!previewStatus.failed,
                  tooltip: previewStatus.failedItems
                    && formatFailedItems(previewStatus.failedItems as Record<string, string>)
                },
              ]}
            />
          )
        }
        {
          !previewStatus && (
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
          onClick={() => {
            onNext()
          }}
        />
      </StepNavButtons>
    </>
  )
}
