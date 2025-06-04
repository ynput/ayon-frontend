import { FC, FormEvent, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { FormLayout, FormRow, InputText, InputNumber, Dropdown } from '@ynput/ayon-react-components'
import { productTypes } from '@shared/util'
import type { DropdownRef } from '@ynput/ayon-react-components'
import { ReviewableUpload } from '@shared/components'
import { useAppDispatch } from '@state/store'
import { useVersionUploadContext } from '../context/VersionUploadContext'

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
  const dispatch = useAppDispatch()
  const { pendingFiles, setPendingFiles, onCloseVersionUpload, extractAndSetVersionFromFiles } =
    useVersionUploadContext()

  const productTypeOptions = Object.entries(productTypes).map(([key, value]) => ({
    value: key,
    label: value.name,
    icon: value.icon,
  }))

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
          <FormRow label="Version">
            <InputNumber
              value={formData.version}
              onChange={handleVersionChange}
              min={minVersion}
              step={1}
              aria-label="Version Number"
              autoFocus={hidden.includes('name')}
              disabled={isFormSubmitted}
            />
          </FormRow>
        )}
      </StyledFormLayout>

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
