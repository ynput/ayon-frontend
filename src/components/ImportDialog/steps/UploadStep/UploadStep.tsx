import { ImportSchema, itemsLabelForImportContext, StepProps } from "../common";
import { Button, FileUpload, FileUploadProps, getFileSizeString } from "@ynput/ayon-react-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StepNavButtons } from "../common.styled";
import { ImportData, parseCSV, serializeCSV } from "../../utils";
import styled from "styled-components";
import { useUploadFileMutation } from "@queries/dataImport";
import Stats from "../Stats";

type Props = StepProps<ImportData> & {
  importSchema: ImportSchema
}

const acceptedTypes = ["text/csv"]

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

export const HiddenFileInput = styled.input`
  display: none;
`

export default function UploadStep({ importContext, importSchema, onBack, onNext }: Props) {
  const [data, setData] = useState<ImportData | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const [uploadFile] = useUploadFileMutation()

  const upload = useCallback((file: File | string) => {
    parseCSV(file)
      .then(async (csv) => {
        const { data, error } = await uploadFile({
          csv: typeof file === "string"
            ? file
            : await file.text(),
        })

        if (error) throw new Error('Upload failed')
        setData({
          ...csv,
          fileId: data.id,
        })
      })
      .catch((error) => setError(error))
  }, [])

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

  const templateURL = useMemo(() => {
    const serialized = serializeCSV({ fields: importSchema.map(({ key }) => key), data: [] })
    const blob = new Blob([serialized], { type: "text/csv" })
    return URL.createObjectURL(blob)
  }, [importSchema])

  return (
    <>
      {
        !data && (
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
                href={templateURL}
                download={`ayon-import-${importContext}-template.csv`}
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
                  label={`Choose .csv file with ${itemsLabelForImportContext[importContext]}`}
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
            onClose={() => setData(null)}
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
