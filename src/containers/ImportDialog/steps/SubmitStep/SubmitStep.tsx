import {
  formatFailedItems,
  ImportContext,
  ImportDataMessage,
  ImportDataProcessSummary,
  ImportDataStartSummary,
  itemsLabelForImportContext,
  StepProps
} from "../common";
import { Button, getFileSizeString } from "@ynput/ayon-react-components";
import { ProgressBar, StepContainer } from "../common.styled";
import { ImportData } from "../../utils";
import usePubSub from "@hooks/usePubSub";
import { useState } from "react";
import { EmptyPlaceholder } from "@shared/components";
import styled from "styled-components";
import Stats from "../Stats";

type Props = StepProps<void> & {
  data: ImportData
  importContext: ImportContext
}

const SuccessState = styled(EmptyPlaceholder)`
  position: static;
  transform: none;
  margin: auto;

  .placeholder-icon {
    background-color: var(--md-sys-color-tertiary);
    color: var(--md-sys-color-on-tertiary);
  }
`

export default function SubmitStep({ data, importContext, onNext  }: Props) {
  const [importProgress, setImportProgress] = useState(0)
  const [importDescription, setImportDescription] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportDataProcessSummary | null>(null)
  type PhaseType = 'upload' | 'processing' | 'unsupported' | 'queued' | 'waiting' | 'importing' | 'validating';
  const [importPhase, setImportPhase] = useState<PhaseType>("validating")

  usePubSub(
    "import.data",
    (_: any, message: ImportDataMessage) => {

      setImportProgress(message.progress)
      setImportDescription(message.description || null)
      setImportPhase(((message.summary as ImportDataProcessSummary)?.phase as PhaseType) ?? 'validating')

      if(message.status === "finished" || message.status === "failed") {
        setImportResult(message.summary as ImportDataProcessSummary)
      }

    },
    null,
    { disableDebounce: true },
  )

  return (
    <>
      <StepContainer>
        {
          importResult && (
            <SuccessState
              icon="check"
              color="var(--md-sys-color-primary)"
              message="Import finished"
            >
              <Stats
                heading={data.fileName}
                subtitle={`Imported ${itemsLabelForImportContext[importContext]}`}
                size={getFileSizeString(data.fileSize)}
                items={[
                  {
                    text: `Created: ${importResult.created}`,
                    icon: "add",
                  },
                  {
                    text: `Updated: ${importResult.updated}`,
                    icon: "difference",
                  },
                  {
                    text: `Skipped: ${importResult.skipped}`,
                    icon: "do_not_disturb",
                  },
                  {
                    text: `Errors: ${importResult.failed}`,
                    icon: "error",
                    danger: !!importResult.failed,
                    tooltip: importResult.failedItems
                      && formatFailedItems(importResult.failedItems as Record<string, string>)
                  },
                ]}
              />
              <Button
                variant="filled"
                label="Close"
                onClick={() => {
                  onNext()
                }}
              />
            </SuccessState>
          )
        }
        {
          !importResult && (
            <>
            <ProgressBar
              type={importPhase}
              name={data.fileName}
              progress={importProgress}
            />
            { importDescription && <p>{importDescription}</p>}
            </>
          )
        }
      </StepContainer>
    </>
  )
}
