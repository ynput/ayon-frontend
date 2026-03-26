import { ImportContext, itemsLabelForImportContext, StepProps } from "../common";
import { Button, getFileSizeString } from "@ynput/ayon-react-components";
import { StepContainer, StepNavButtons } from "../common.styled";
import { ImportData } from "@components/ImportDialog/utils";
import { ImportStatus } from "@shared/api/generated/dataImport";
import Stats from "../Stats";

type Props = StepProps<void> & {
  data: ImportData
  previewStatus: ImportStatus
  importContext: ImportContext
}

export default function PreviewStep({ data, previewStatus, importContext, onBack, onNext }: Props) {
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
