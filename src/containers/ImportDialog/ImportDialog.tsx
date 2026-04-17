import { DialogProps } from "@ynput/ayon-react-components";
import { useCallback, useState } from "react";
import { DialogContainer, DialogHeading, ImportContextWrapper, TemplatesSelector } from "./ImportDialog.styled";
import { ImportData } from "./utils";
import { contextLabelForImportContext, ImportStep, itemsLabelForImportContext } from "./steps/common";
import clsx from "clsx";
import { ViewsMenuContainer, ViewsProvider, ViewsButton } from "@shared/containers";
import { useDispatch } from "react-redux";
import ViewsDialogContainer from "@shared/containers/Views/ViewsDialogContainer/ViewsDialogContainer";
import ImportSteps from "./Steps";
import { useImportDialogContext } from "./context/ImportDialogProvider";

const dialogSizeForStep: Record<ImportStep, DialogProps["size"]> = {
  [ImportStep.UPLOAD]: "lg",
  [ImportStep.MAP_COLUMNS]: "full",
  [ImportStep.REVIEW_VALUES]: "full",
  [ImportStep.PREVIEW]: "full",
  [ImportStep.SUBMIT]: "full",
}

const PRESETS_BUTTON_LABEL = "Mapping presets"

export default function ImportDialog() {
  const dispatch = useDispatch()

  const {
    importing: importContext,
    folderId,
    projectName,
    close,
  } = useImportDialogContext()

  const [step, setStep] = useState<ImportStep>(ImportStep.UPLOAD)
  const [data, setData] = useState<ImportData | null>(null)

  const closeDialog = useCallback(() => {
    close()
    setStep(ImportStep.UPLOAD)
    setData(null)
  }, [close])

  if (!importContext) return null

  return (
    <>
      <DialogContainer
        isOpen
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
            folderId={folderId}
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
