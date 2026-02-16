import { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import type { DropdownRef } from '@ynput/ayon-react-components'
import {
  Button,
  Dropdown,
  FormLayout,
  FormRow,
  Icon,
  InputNumber,
  InputText,
} from '@ynput/ayon-react-components'
import { ReviewableUpload } from '@shared/components'
import { useVersionUploadContext } from '../context/VersionUploadContext'
import { useProjectContext } from '@shared/context'
import { useGetTaskQuery } from '@shared/api'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog/EntityPickerDialog'
import { Skeleton } from 'primereact/skeleton'

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  padding: var(--padding-m);
  width: 100%;
`

const StyledFormLayout = styled(FormLayout)`
  width: 100%;
  margin: auto;

  & > div {
    align-items: start;
  }

  input {
    width: 100%;
  }
`

const RecommendationNote = styled.div`
  font-size: var(--font-size-xs);
  color: var(--md-sys-color-outline);
  margin-top: var(--base-gap-small);
  line-height: 1.3;
`

const InlineButton = styled.button`
  background: none;
  border: none;
  color: var(--md-sys-color-primary);
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  font-family: inherit;

  &:hover {
    color: var(--md-sys-color-primary-dark);
  }
`

const StyledUpload = styled.div`
  position: relative;
  min-height: 80px;
`

const TaskFieldContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  width: 100%;
`

const TaskButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  cursor: pointer;
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  background: none;
  border: none;
  text-align: left;

  &:hover {
    background: var(--md-sys-color-surface-container);
    border-radius: var(--border-radius-m);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
    &:hover {
      background: none;
    }
  }
`

const TaskText = styled.div`
  width: 100%;
  overflow: hidden;
  display: flex;
  min-width: 0;
`

const TaskPath = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: fit-content;
  margin-right: 4px;
  flex: 1;
`

const TaskValue = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
`

type FormData = {
  version: number
  name: string
  productType: string
}

interface UploadVersionFormProps {
  formData: FormData
  onChange: (key: keyof FormData, value: string | number) => void
  onSubmit: (formData: FormData) => void
  hidden?: (keyof FormData)[]
  projectName: string
  minVersion?: number
  versionId?: string | null
  productId?: string | null
}

export const UploadVersionForm: FC<UploadVersionFormProps> = ({
  formData,
  onChange,
  onSubmit,
  hidden = [],
  projectName,
  minVersion = 1,
  versionId,
  productId,
}) => {
  const previousProductTypeRef = useRef<string>(formData.productType)
  const dropdownRef = useRef<DropdownRef>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const {
    pendingFiles,
    setPendingFiles,
    onCloseVersionUpload,
    extractAndSetVersionFromFiles,
    dispatch,
    taskId,
    linkedTask,
    isLoadingTask,
    setTaskId,
    setLinkedTask,
    folderId,
  } = useVersionUploadContext()

  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false)

  // Fetch full task data for path; linkedTask provides instant name/type display
  const { data: taskData, isFetching: isFetchingTask } = useGetTaskQuery({ projectName, taskId }, { skip: !taskId })
  const isTaskLoading = isLoadingTask || (!!taskId && isFetchingTask && !linkedTask)

  // Use task's folder when available, fall back to product's folder
  const pickerFolderId = taskData?.folderId || folderId

  const project = useProjectContext()

  const taskName = taskData?.label || taskData?.name || linkedTask?.label || linkedTask?.name || ''
  const taskType = taskData?.taskType || linkedTask?.taskType
  const taskTypeInfo = taskType ? project.getTaskType(taskType) : undefined
  const taskIcon = taskTypeInfo?.icon || 'task_alt'
  const taskFolderPath = taskData?.path
    ? taskData.path.substring(0, taskData.path.lastIndexOf('/'))
    : ''

  const productTypeOptions = project.getProductTypeOptions()
  const productTypes = useMemo(() => {
    return project.productTypes.reduce((acc, type) => {
      acc[type.name] = type
      return acc
    }, {} as Record<string, { name: string; icon?: string; color?: string }>)
  }, [project.productTypes])

  useEffect(() => {
    // Check if the current name starts with the previous product type name
    const previousProductType = previousProductTypeRef.current
    const previousProductTypeName = productTypes[previousProductType]?.name || ''
    const currentProductTypeName = productTypes[formData.productType]?.name || ''

    // Only sync if the product type actually changed
    if (formData.productType !== previousProductType && previousProductTypeName) {
      // Check if the current name starts with the previous product type name
      if (formData.name.startsWith(previousProductTypeName)) {
        // Extract the suffix after the previous product type name
        const suffix = formData.name.slice(previousProductTypeName.length)
        // Create the new name with the current product type + suffix
        const newName = currentProductTypeName + suffix
        onChange('name', newName)
      }
    }

    // Update the ref to the current product type
    previousProductTypeRef.current = formData.productType
  }, [formData.productType, formData.name, onChange])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // @ts-expect-error - submitter is not defined in the type
    const submitter = e.nativeEvent.submitter as HTMLButtonElement | null
    // if the submitter is a button, check it's parent does not have the dropdown class
    if (submitter && submitter.closest('.dropdown')) {
      // if the submitter is a button inside a dropdown, do not submit the form
      return
    }

    onSubmit(formData)
  }

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      onChange('version', value)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('name', e.target.value)
  }

  const handleProductTypeChange = (value: string[]) => {
    if (value.length > 0) {
      onChange('productType', value[0])
      //   focus the name input after changing product type
    }
  }

  const handleApplyPrefix = () => {
    const currentProductTypeName = productTypes[formData.productType]?.name || ''
    const currentName = formData.name || ''

    // Capitalize the first letter of the existing name for camelCase
    const capitalizedName = currentName.charAt(0).toUpperCase() + currentName.slice(1)
    const newName = currentProductTypeName + capitalizedName
    onChange('name', newName)
  }

  const shouldShowRecommendation = () => {
    const currentProductTypeName = productTypes[formData.productType]?.name || ''
    return formData.name && !formData.name.startsWith(currentProductTypeName)
  }

  // Disable form fields if version has been created
  const isFormSubmitted = Boolean(versionId)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Submit form on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit(formData)
      return
    }
  }

  return (
    <StyledForm
      id="upload-version-form"
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      onKeyDown={handleKeyDown}
    >
      <StyledFormLayout>
        {!hidden.includes('productType') && (
          <FormRow label="Product Type">
            <Dropdown
              ref={dropdownRef}
              options={productTypeOptions}
              value={[formData.productType]}
              onChange={handleProductTypeChange}
              widthExpand
              multiSelect={false}
              aria-label="Product Type"
              search
              disabled={isFormSubmitted}
            />
          </FormRow>
        )}

        {!hidden.includes('name') && (
          <FormRow label="Product Name">
            <div>
              <InputText
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Enter product name"
                minLength={1}
                autoFocus
                aria-label="Product Name"
                aria-describedby={shouldShowRecommendation() ? 'name-recommendation' : undefined}
                disabled={isFormSubmitted}
              />
              {shouldShowRecommendation() && (
                <RecommendationNote id="name-recommendation">
                  We recommend prefixing with "{productTypes[formData.productType]?.name}".{' '}
                  <InlineButton type="button" onClick={handleApplyPrefix}>
                    Apply prefix
                  </InlineButton>
                </RecommendationNote>
              )}
            </div>
          </FormRow>
        )}

        {!hidden.includes('version') && (
          <FormRow label={'Version'}>
            <InputNumber
              value={formData.version}
              onChange={handleVersionChange}
              min={minVersion}
              step={1}
              aria-label={'Version Number'}
              autoFocus={hidden.includes('name')}
              disabled={isFormSubmitted}
            />
          </FormRow>
        )}

        <FormRow label={'Task'}>
          <TaskFieldContainer>
            {isTaskLoading ? (
              <Skeleton height={'20px'} />
            ) : taskId && taskName ? (
              <>
                <TaskButton
                  type={'button'}
                  onClick={() => setIsTaskPickerOpen(true)}
                  disabled={isFormSubmitted}
                >
                  <Icon icon={taskIcon} style={{ color: taskTypeInfo?.color }} />
                  <TaskText>
                    {taskFolderPath && (
                      <TaskPath>
                        {taskFolderPath.split('/').filter(Boolean).join(' / ')} /{' '}
                      </TaskPath>
                    )}
                    <TaskValue>{taskName}</TaskValue>
                  </TaskText>
                </TaskButton>
                <Button
                  type={'button'}
                  icon={'close'}
                  variant={'text'}
                  onClick={() => {
                    setTaskId('')
                    setLinkedTask(null)
                  }}
                  disabled={isFormSubmitted}
                />
              </>
            ) : (
              <Button
                type={'button'}
                icon={'link'}
                label={'Link task'}
                variant={'text'}
                onClick={() => setIsTaskPickerOpen(true)}
                disabled={isFormSubmitted}
              />
            )}
          </TaskFieldContainer>
        </FormRow>
      </StyledFormLayout>

      {isTaskPickerOpen && (
        <EntityPickerDialog
          projectName={projectName}
          entityType={'task'}
          initialSelection={{
            ...(pickerFolderId ? { folder: { [pickerFolderId]: true } } : {}),
            ...(taskId ? { task: { [taskId]: true } } : {}),
          }}
          onSubmit={(selection) => {
            if (selection.length > 0) {
              setTaskId(selection[0])
            }
            setIsTaskPickerOpen(false)
          }}
          onClose={() => setIsTaskPickerOpen(false)}
        />
      )}

      <FormRow label="Reviewable files" />
      <StyledUpload>
        <ReviewableUpload
          projectName={projectName}
          versionId={versionId}
          productId={productId}
          dispatch={dispatch}
          pendingFiles={pendingFiles}
          setPendingFiles={setPendingFiles}
          onUpload={onCloseVersionUpload}
          onFilesAdded={extractAndSetVersionFromFiles}
          pt={{
            upload: {
              style: { minHeight: 80 },
            },
            dropzone: {
              style: { inset: 0 },
            },
          }}
        />
      </StyledUpload>
    </StyledForm>
  )
}
