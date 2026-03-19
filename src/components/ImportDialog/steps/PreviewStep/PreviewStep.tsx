import { ResolvedColumnMappings, StepProps, ValueMappings } from "../common";
import { Button } from "@ynput/ayon-react-components";
import { StepNavButtons } from "../common.styled";
import { ImportData } from "@components/ImportDialog/utils";

type Props = StepProps<void> & {
  data: ImportData
  columnMappings: ResolvedColumnMappings
  mappings: ValueMappings
}

export default function PreviewStep({ onBack, onNext }: Props) {
  return (
    <>
      PREVIEW
      <StepNavButtons>
        <Button
          variant="nav"
          label="Back"
          onClick={onBack}
        />
        <Button
          variant="filled"
          label="Next"
          onClick={() => {
            onNext()
          }}
        />
      </StepNavButtons>
    </>
  )
}
