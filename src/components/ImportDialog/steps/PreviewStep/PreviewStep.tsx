import { ImportContext, ResolvedColumnMappings, StepProps, ValueMappings } from "../common";
import { Button, getFileSizeString } from "@ynput/ayon-react-components";
import { StepContainer, StepNavButtons } from "../common.styled";
import { ImportData } from "@components/ImportDialog/utils";
import { useImportDataMutation } from "@queries/dataImport";
import { useEffect, useMemo, useState } from "react";
import { ColumnMapping, ImportStatus } from "@shared/api/generated/dataImport";
import { toast } from "react-toastify";
import Stats from "../Stats";

type Props = StepProps<void> & {
  data: ImportData
  previewStatus: ImportStatus
  importContext: ImportContext
}

const itemsLabelForImporContext: Record<ImportContext, string> = {
  hierarchy: "folders and tasks",
  user: "users",
  folder: "folders",
  task: "tasks",
  // TODO: add this once lists are supported in the backend
  // list: "items",
}

export default function PreviewStep({ data, previewStatus, importContext, onBack, onNext }: Props) {
  return (
    <>
      <StepContainer>
        {
          previewStatus && (
            <Stats
              heading={data.fileName}
              subtitle={`Importing ${itemsLabelForImporContext[importContext]}`}
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
                  text: `Failed: ${previewStatus.failed}`,
                  icon: "error",
                  danger: !!previewStatus.failed,
                },
              ]}
              onClose={() => onBack()}
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
