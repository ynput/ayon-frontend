import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { useSetProjectBundleMutation } from '@shared/api'
import {
  DefaultValueTemplate,
  Dialog,
  DialogProps,
  Dropdown,
  DropdownProps,
  SaveButton,
} from '@ynput/ayon-react-components'
import { FC, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

const StyledDialog = styled(Dialog)`
  max-height: unset;

  .body {
    gap: 16px;
    padding-top: 0;
  }
`

const StyledRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`

type ProjectBundleForm = {
  production: string | undefined
  staging: string | undefined
}

interface PerProjectBundleDialogProps extends Partial<DialogProps> {
  projectName: string
  init: ProjectBundleForm
  onClose: () => void
}

const initForm: ProjectBundleForm = {
  production: undefined,
  staging: undefined,
}

const PerProjectBundleDialog: FC<PerProjectBundleDialogProps> = ({
  projectName,
  init = initForm,
  onClose,
  ...props
}) => {
  const [setProjectBundle, { isLoading }] = useSetProjectBundleMutation()

  const { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: false })
  const projectBundles = bundles.filter((b) => b.isProject)

  const variants = ['production', 'staging'] as const
  type VariantType = (typeof variants)[number]

  const [form, setForm] = useState<ProjectBundleForm>(init)

  //   update initial form if it changes
  useEffect(() => {
    setForm(init)

    return () => {
      setForm(initForm)
    }
  }, [init])

  const handleChange = (bundle: string | null, variant: VariantType) => {
    setForm((prev) => ({ ...prev, [variant]: bundle }))
  }

  const handleSubmit = async () => {
    try {
      await setProjectBundle({ projectName, projectBundleModel: form }).unwrap()

      onClose()

      toast.success(`Project bundles updated for ${projectName}`)
    } catch (error) {
      console.error('Error setting project bundle:', error)
      toast.error(`Failed to set project bundle: ${error || 'Unknown error'}`)
    }
  }

  const hasChanges = Object.entries(form).some(
    ([key, value]) => value !== init[key as keyof ProjectBundleForm],
  )

  const getProjectBundleOptions = (variant: VariantType) => {
    const options: DropdownProps['options'][number] = [
      ...projectBundles.map((b) => ({
        label: b.name,
        value: b.name,
      })),
    ]

    if (form[variant]) {
      options.unshift({ label: 'None', value: undefined, icon: 'close' })
    }

    return options
  }

  const someProjectBundles = projectBundles.length > 0
  const placeholder = someProjectBundles
    ? 'Select a project bundle...'
    : 'No project bundles available'

  const renderVariantDropdown = (variant: VariantType) => (
    <StyledRow key={variant}>
      <label style={{ textTransform: 'capitalize' }}>{variant}</label>
      <Dropdown
        value={form[variant] ? [form[variant]] : []}
        options={getProjectBundleOptions(variant)}
        onChange={(v) => handleChange(v[0] || null, variant)}
        placeholder={placeholder}
        disabled={!someProjectBundles}
        valueTemplate={(v, _a, o) => (
          <DefaultValueTemplate value={v} isOpen={o} placeholder={placeholder}>
            {v}
          </DefaultValueTemplate>
        )}
        searchOnNumber={10}
      />
    </StyledRow>
  )

  return (
    <StyledDialog
      {...props}
      onClose={onClose}
      isOpen
      header={'Set Project Bundle - ' + projectName}
      size="sm"
      footer={
        <SaveButton onClick={handleSubmit} active={hasChanges} saving={isLoading}>
          Save
        </SaveButton>
      }
    >
      <span>
        Assign a project bundle to this project so that it can have specific addon versions and
        settings.
      </span>
      {variants.map(renderVariantDropdown)}
    </StyledDialog>
  )
}

export default PerProjectBundleDialog
