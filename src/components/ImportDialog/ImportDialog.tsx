import { Button, DialogProps } from "@ynput/ayon-react-components";
import { useCallback, useState } from "react";
import { DialogContainer, DialogHeading, ImportContextWrapper, TemplatesSelector } from "./ImportDialog.styled";
import { ImportData } from "./utils";
import { contextLabelForImportContext, ImportContext, ImportStep, itemsLabelForImportContext } from "./steps/common";
import clsx from "clsx";
import { ViewsMenuContainer, ViewsProvider, ViewsButton } from "@shared/containers";
import { useDispatch } from "react-redux";
import ViewsDialogContainer from "@shared/containers/Views/ViewsDialogContainer/ViewsDialogContainer";
import ImportSteps from "./Steps";

type Props = {
  importContext: ImportContext
  projectName?: string
}

const dialogSizeForStep: Record<ImportStep, DialogProps["size"]> = {
  [ImportStep.UPLOAD]: "lg",
  [ImportStep.MAP_COLUMNS]: "full",
  [ImportStep.REVIEW_VALUES]: "full",
  [ImportStep.PREVIEW]: "full",
}

const PRESETS_BUTTON_LABEL = "Mapping presets"

export default function ImportDialog({ importContext, projectName }: Props) {
  const dispatch = useDispatch()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>(ImportStep.UPLOAD)
  const [data, setData] = useState<ImportData | null>(null)

  const closeDialog = useCallback(() => {
    setOpen(false)
    setStep(ImportStep.UPLOAD)
    setData(null)
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
            Import {itemsLabelForImportContext[importContext]}
            <TemplatesSelector
              className={clsx({ shown: step > ImportStep.UPLOAD && step < ImportStep.PREVIEW })}
            >
              <span id={`import.${importContext}-views-portal`}></span>
            </TemplatesSelector>
            <ImportContextWrapper>
              {contextLabelForImportContext[importContext]}
              {
                data
                  ? ` - ${data.fileName}`
                  : ''
              }
            </ImportContextWrapper>
          </DialogHeading>
        )}
      >
        <ViewsProvider
          projectName={projectName}
          viewType={`import.${importContext}`}
          viewAlias="Preset"
          dispatch={dispatch}
        >
          <ViewsButton
            fullButton
            fullButtonProps={
              (selectedView) => ({
                label: selectedView?.working
                  ? PRESETS_BUTTON_LABEL
                  : selectedView?.label ?? PRESETS_BUTTON_LABEL,
                selected: selectedView && !selectedView.working
              })
            }
          />
          <ViewsMenuContainer />
          <ViewsDialogContainer />
          <ImportSteps
            importContext={importContext}
            projectName={projectName}
            data={data}
            setData={setData}
            step={step}
            setStep={setStep}
            onClose={closeDialog}
          />
        </ViewsProvider>
      </DialogContainer >
    </>
  )
}
