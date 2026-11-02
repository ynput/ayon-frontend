import { ImportSchema, itemsLabelForImportContext, StepProps } from "../common";
import { Button, FileUpload, FileUploadProps, getFileSizeString } from "@ynput/ayon-react-components";
import { useCallback, useEffect, useRef, useState } from "react";
import { StepNavButtons } from "../common.styled";
import { ImportData, parseCSV } from "../../utils";
import styled from "styled-components";
import { useUploadFileMutation } from "@queries/dataImport";
import Stats from "../Stats";
import { HiddenFileInput, SheetButton, SheetList, SheetPicker } from "./UploadStep.styled";
import { ImportMode, templateForImport } from "../importMode";
import { EXCEL_MIME_TYPE, excelSheetToCSV, ExcelSheet, isExcelFile, readExcelSheets } from "../../excel";

type Props = StepProps<ImportData> & {
  importSchema: ImportSchema
  uploaded: ImportData | null
  importMode: ImportMode
  onLoaded?: (data: ImportData) => void
}

const acceptedTypes = [".csv", "text/csv", ".xlsx", EXCEL_MIME_TYPE]

type Workbook = {
  file: File
  sheets: ExcelSheet[]
}

const FileUploadWrapper = styled.div`
  position: relative;
  flex-grow: 1;
`

const FileUploadButtons = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: var(--base-gap-medium);
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
`

const FileUploadHint = styled.p`
  color: var(--md-sys-color-outline);
  flex-basis: 100%;
  text-align: center;
`

export default function UploadStep({
  importContext,
  uploaded,
  importMode,
  onLoaded,
  onBack,
  onNext,
}: Props) {
  const [data, setData] = useState<ImportData | null>(uploaded)
  const [error, setError] = useState<Error | null>(null)
  // an Excel file with several sheets waits for the user to pick one
  const [workbook, setWorkbook] = useState<Workbook | null>(null)
  // only the latest upload or sheet pick may set the result, earlier ones finish unseen
  const requestRef = useRef(0)
  const startRequest = useCallback(() => {
    requestRef.current += 1
    const request = requestRef.current
    return () => request === requestRef.current
  }, [])

  useEffect(() => {
    if (data) onLoaded?.(data)
  }, [data])

  const [uploadFile] = useUploadFileMutation()

  const uploadCSV = useCallback(async (file: File | string) => {
    const csv = await parseCSV(file)
    const { data, error } = await uploadFile({
      csv: typeof file === "string"
        ? file
        : await file.text(),
    })

    if (error) throw new Error('Upload failed')
    return { ...csv, fileId: data.id }
  }, [uploadFile])

  const uploadSheet = useCallback((file: File, sheet: ExcelSheet) => {
    const isCurrent = startRequest()
    setError(null)
    uploadCSV(excelSheetToCSV(sheet))
      .then((csv) => {
        if (!isCurrent()) return
        setWorkbook(null)
        setData({
          ...csv,
          fileName: file.name,
          fileSize: file.size,
          sheetName: sheet.name,
        })
      })
      .catch((error) => isCurrent() && setError(error))
  }, [uploadCSV, startRequest])

  // a new file replaces the loaded one and any sheet picker that is open
  const upload = useCallback((file: File | string) => {
    const isCurrent = startRequest()
    setError(null)
    setData(null)
    setWorkbook(null)
    if (typeof file === "object" && isExcelFile(file)) {
      readExcelSheets(file)
        .then((sheets) => {
          if (!isCurrent()) return
          if (sheets.length === 0) throw new Error('The file has no sheet with data')
          if (sheets.length === 1) return uploadSheet(file, sheets[0])
          setWorkbook({ file, sheets })
        })
        .catch((error) => isCurrent() && setError(error))
      return
    }

    uploadCSV(file)
      .then((csv) => isCurrent() && setData(csv))
      .catch((error) => isCurrent() && setError(error))
  }, [uploadCSV, uploadSheet, startRequest])

  const uploadFilesFromComponent = useCallback((files: FileUploadProps["files"]) => {
    if (files.length === 0) return

    const firstFile = files[0].file
    upload(firstFile)
  }, [upload])

  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      if (!event.clipboardData) return

      if (event.clipboardData.files.length > 0) {
        uploadFilesFromComponent(Array.from(event.clipboardData.files).map((file) => ({
          file,
          sequenceId: "",
          sequenceNumber: 0,
        })))

        return
      }

      upload(event.clipboardData?.getData("text"))
    }

    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [upload, uploadFilesFromComponent])

  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      {
        !data && workbook && (
          <SheetPicker>
            <Stats
              heading={workbook.file.name}
              subtitle={
                error
                  ? `Could not import this sheet: ${error.message}`
                  : "Which sheet do you want to import?"
              }
              size={getFileSizeString(workbook.file.size)}
              items={[]}
              onClose={() => {
                startRequest()
                setWorkbook(null)
                setError(null)
              }}
            />
            <SheetList>
              {
                workbook.sheets.map((sheet) => (
                  <SheetButton
                    key={sheet.name}
                    icon="table"
                    label={`${sheet.name} (${sheet.rows.length - 1} row${sheet.rows.length === 2 ? "" : "s"})`}
                    onClick={() => uploadSheet(workbook.file, sheet)}
                  />
                ))
              }
            </SheetList>
          </SheetPicker>
        )
      }
      {
        !data && !workbook && (
          <FileUploadWrapper>
            <FileUpload
              files={[]}
              setFiles={(f) => {
                const files = typeof f === "function" ? f([]) : f
                uploadFilesFromComponent(files)
              }}
              placeholder=" "
              dropIcon=" "
              header={<></>}
              footer={<></>}
              accept={acceptedTypes}
              isError={Boolean(error)}
              errorMessage={error ? `Could not parse this file: ${error?.message}` : undefined}
            />
            <FileUploadButtons>
              <a
                href={`/templates/${templateForImport(importContext, importMode)}`}
                download={templateForImport(importContext, importMode)}
              >
                <Button
                  icon="download"
                  variant="text"
                  label="Download template"
                />
              </a>
              <label>
                <HiddenFileInput
                  ref={hiddenFileInputRef}
                  type="file"
                  accept={acceptedTypes.join()}
                  onChange={(event) => {
                    if (!event.target.files || event.target.files?.length === 0) return
                    upload(event.target.files[0])
                  }}
                />
                <Button
                  icon="upload_file"
                  label={`Choose a CSV or Excel file with ${itemsLabelForImportContext[importContext]}`}
                  onClick={() => hiddenFileInputRef.current?.click()}
                />
              </label>
              <FileUploadHint>
                Drop a file here or paste CSV from the clipboard
              </FileUploadHint>
            </FileUploadButtons>
          </FileUploadWrapper>
        )
      }
      {
        data && (
          <Stats
            heading={data.fileName}
            subtitle={data.sheetName && `Sheet: ${data.sheetName}`}
            size={getFileSizeString(data.fileSize)}
            items={[
              {
                text: `${data.columns.length} columns found`,
                icon: "table_rows",
                rotated: true,
              },
              {
                text: `${data.rows.length} rows found`,
                icon: "table_rows",
              }
            ]}
            onClose={() => {
              startRequest()
              setData(null)
            }}
          />
        )
      }
      <StepNavButtons>
        <Button
          variant="nav"
          label="Back"
          onClick={() => onBack()}
        />
        <Button
          variant="filled"
          label="Next"
          disabled={!Boolean(data)}
          onClick={() => {
            if (!data) return
            onNext(data)
          }}
        />
      </StepNavButtons>
    </>
  )
}
