import { Button } from "@ynput/ayon-react-components";
import { useImportDialogContext } from "./context/ImportDialogProvider";
import { ImportContext } from "./steps/common";

type Props = {
  importContext: ImportContext
  projectName?: string
  folderId?: string
}

export default function ImportDialogButton({ importContext, projectName, folderId }: Props) {
  const { openForContext } = useImportDialogContext()

  return (
    <Button
      icon="upload_file"
      label="Import CSV"
      onClick={() => openForContext(importContext, projectName, folderId)}
    />
  )
}
