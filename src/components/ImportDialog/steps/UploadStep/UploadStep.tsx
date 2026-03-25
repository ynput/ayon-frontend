import { StepProps } from "../common";
import { Button, FileUpload, FileUploadProps, getFileSizeString, Icon, Panel } from "@ynput/ayon-react-components";
import { useEffect, useRef, useState } from "react";
import { StepNavButtons } from "../common.styled";
import { ImportData, parseCSV } from "../../utils";
import styled from "styled-components";
import { useUploadFileMutation } from "@queries/dataImport";

type Props = StepProps<ImportData>

const acceptedTypes = ["text/csv"]

const FileUploadWrapper = styled.div`
  position: relative;
  flex-grow: 1;
`

const FileUploadButtons = styled.div`
  display: flex;
  gap: var(--base-gap-medium);
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
`

export const HiddenFileInput = styled.input`
  display: none;
`

export const FileStatsWrapper = styled.div`
  flex-grow: 1;
  align-content: center;
  justify-content: center;
`

export const FileStats = styled(Panel)`
  background: var(--md-sys-color-surface-container-high);
  margin: 0 auto;
  max-width: max-content;
`
export const FileStat = styled(Panel)`
  background: var(--md-sys-color-surface-container-low);
  padding: var(--padding-s);
`
export const FileStatsHeading = styled.h2`
  margin: 0;
  font-size: inherit;
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  min-width: 300px;
`
export const FileStatsFileSize = styled.span`
  color: var(--md-sys-color-outline);
  margin-left: 1ch;
`
export const FileStatsRemove = styled(Button)`
  margin-left: auto;
  margin-right: 0;
`

export default function UploadStep({ importContext, onBack, onNext }: Props) {
  const [files, setFiles] = useState<FileUploadProps["files"]>([])
  const [data, setData] = useState<ImportData | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const [uploadFile] = useUploadFileMutation()

  useEffect(() => {
    if (files.length === 0) return

    const firstFile = files[0].file
    parseCSV(firstFile)
      .then(async (csv) => {
        const { data, error } = await uploadFile({
          csv: await firstFile.text(),
        })

        if (error) throw new Error('Upload failed')
        setData({ ...csv, fileId: data.id })
      })
      .catch((error) => setError(error))
  }, [files])

  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      {
        !data && (
          <FileUploadWrapper>
            <FileUpload
              files={files}
              setFiles={setFiles}
              placeholder=" "
              dropIcon=" "
              header={<></>}
              footer={<></>}
              accept={acceptedTypes}
              isError={Boolean(error)}
              errorMessage={error ? `Could not parse this file: ${error?.message}` : undefined}
            />
            <FileUploadButtons>
              <Button
                variant="text"
                label="Download template"
              />
              <label>
                <HiddenFileInput
                  ref={hiddenFileInputRef}
                  type="file"
                  accept={acceptedTypes.join()}
                  onChange={(event) => {
                    if (!event.target.files || event.target.files?.length === 0) return
                    // fake the CustomFile data structure for compatibility with <FileUpload />
                    setFiles([{
                      file: event.target.files[0],
                      sequenceId: null,
                      sequenceNumber: 0,
                    }])
                  }}
                />
                <Button
                  label={`Choose ${importContext} .csv file`}
                  onClick={() => hiddenFileInputRef.current?.click()}
                />
              </label>
            </FileUploadButtons>
          </FileUploadWrapper>
        )
      }
      {
        data && files.length > 0 && (
          <FileStatsWrapper>
            <FileStats>
              <FileStatsHeading>
                {files[0].file.name}
                <FileStatsFileSize>
                  {getFileSizeString(files[0].file.size)}
                </FileStatsFileSize>
                <FileStatsRemove
                  icon="close"
                  variant="nav"
                  onClick={() => {
                    setFiles([])
                    setData(null)
                  }}
                />
              </FileStatsHeading>
              <FileStat direction="row">
                <Icon icon="table_rows" style={{ rotate: "90deg" }} />
                {data.columns.length} columns found
              </FileStat>
              <FileStat direction="row">
                <Icon icon="table_rows" />
                {data.rows.length} rows found
              </FileStat>
            </FileStats>
          </FileStatsWrapper>
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
