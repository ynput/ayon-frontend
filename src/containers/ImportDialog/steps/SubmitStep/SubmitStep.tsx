import {
  getImportStatsItems,
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
import { ImportMode } from "../importMode";
import { ImportStatus } from "@shared/api/generated/dataImport";

type Props = StepProps<void> & {
  data: ImportData
  // the import response, set once the request is done
  result?: ImportStatus | null
  error?: unknown
  importContext: ImportContext
  importMode: ImportMode
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

const ErrorState = styled(EmptyPlaceholder)`
  position: static;
  transform: none;
  margin: auto;
`

export default function SubmitStep({ data, result, error, importContext, importMode, onNext  }: Props) {
  const [importProgress, setImportProgress] = useState(0)
  const [importDescription, setImportDescription] = useState<string | null>(null)
  const [eventResult, setEventResult] = useState<ImportDataProcessSummary | null>(null)
  type PhaseType = 'upload' | 'processing' | 'unsupported' | 'queued' | 'waiting' | 'importing' | 'validating';
  const [importPhase, setImportPhase] = useState<PhaseType>("validating")

  usePubSub(
    "import.data",
    (_: any, message: ImportDataMessage) => {

      setImportProgress(message.progress)
      setImportDescription(message.description || null)
      setImportPhase(((message.summary as ImportDataProcessSummary)?.phase as PhaseType) ?? 'validating')

      if(message.status === "finished" || message.status === "failed") {
        setEventResult(message.summary as ImportDataProcessSummary)
      }

    },
    null,
    { disableDebounce: true },
  )

  // the events may not arrive (e.g. websocket not connected), the response always does
  const importResult = result ?? eventResult

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
                subtitle={importMode === ImportMode.UPDATE_ONLY
                  ? `Updated existing ${itemsLabelForImportContext[importContext]}`
                  : `Imported ${itemsLabelForImportContext[importContext]}`}
                size={getFileSizeString(data.fileSize)}
                items={getImportStatsItems(importResult, true)}
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
          !importResult && !!error && (
            <ErrorState message="Import failed" error={error}>
              <Button variant="filled" label="Close" onClick={() => onNext()} />
            </ErrorState>
          )
        }
        {
          !importResult && !error && (
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
