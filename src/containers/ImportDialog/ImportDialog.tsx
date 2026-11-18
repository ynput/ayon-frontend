import { DialogProps } from "@ynput/ayon-react-components";
import { useCallback, useState } from "react";
import { DialogContainer, DialogHeading, ImportContextWrapper, ImportTarget, TemplatesSelector } from "./ImportDialog.styled";
import { ImportData } from "./utils";
import { ImportStep } from "./steps/common";
import clsx from "clsx";
import { ViewsMenuContainer, ViewsProvider, ViewsButton } from "@shared/containers";
import { useDispatch } from "react-redux";
import ViewsDialogContainer from "@shared/containers/Views/ViewsDialogContainer/ViewsDialogContainer";
import ImportSteps from "./Steps";
import { useImportDialogContext, useImportLabels } from "./context/ImportDialogProviderInstance"

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
    folderLabel,
    listFolderId,
    projectName,
    addonImport,
    close,
  } = useImportDialogContext()
  const labels = useImportLabels()
  // the mapping presets of an addon's import are its own
  const presetsType = `import.${addonImport ? addonImport.id : importContext}`

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
            Import {labels.items}
            {folderLabel && <>{" into "}<ImportTarget>{folderLabel}</ImportTarget></>}
            <TemplatesSelector
              className={clsx({ shown: step > ImportStep.UPLOAD && step < ImportStep.PREVIEW })}
            >
              <span id={`${presetsType}-views-portal`}></span>
            </TemplatesSelector>
            <ImportContextWrapper>
              {labels.context}
              {
                data
                  ? ` - ${data.fileName}${data.sheetName ? `, ${data.sheetName}` : ''}`
                  : ''
              }
            </ImportContextWrapper>
          </DialogHeading>
        )}
      >
        <ViewsProvider
          projectName={projectName}
          viewType={presetsType}
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
            listFolderId={listFolderId}
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
