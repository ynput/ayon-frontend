import { ImportContext, ImportDataMessage, ImportDataProcessSummary, ImportDataStartSummary, itemsLabelForImportContext, StepProps } from "../common";
import { Button, getFileSizeString } from "@ynput/ayon-react-components";
import { StepContainer, StepNavButtons } from "../common.styled";
import { ImportData } from "@components/ImportDialog/utils";
import { ImportStatus } from "@shared/api/generated/dataImport";
import Stats from "../Stats";
import usePubSub from "@hooks/usePubSub";
import { useState } from "react";
import { ReviewableProgressCard } from "@shared/components";
import styled from "styled-components";

type Props = StepProps<void> & {
  data: ImportData
  previewStatus: ImportStatus | null
  importContext: ImportContext
}

const ProgressBar = styled(ReviewableProgressCard)`
  justify-content: center;
  margin: auto;
  max-width: max-content;
  padding-right: var(--padding-l);

  .content {
    flex-grow: 0;
  }
`

export default function PreviewStep({ data, previewStatus, importContext, onBack, onNext }: Props) {
  const [previewProgress, setPreviewProgress] = useState(0)

  usePubSub(
    "import.data",
    (_: any, message: ImportDataMessage) => {
      if ((message.summary as ImportDataStartSummary).total) return

      const processedCount = Object.values(message.summary as ImportDataProcessSummary)
        .reduce((a, i) => {
          if (typeof i !== "number") return a
          return a + i
        }, 0)

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
