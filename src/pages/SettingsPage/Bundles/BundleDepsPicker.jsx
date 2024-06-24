import { Button, Dropdown, FormRow, SaveButton } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'

const BundleDepsPicker = ({
  packages = [],
  value = {},
  initPackage = '',
  onChange,
  isUpdating,
  onSubmit,
  onCancel,
}) => {
  const options = useMemo(
    () =>
      [...packages]
        .filter((p) => p.platform === value?.platform)
        .map((p) => ({ label: p.filename, value: p.filename }))
        .sort((a, b) => b.label.localeCompare(a.label)),
    [packages],
  )

  const disabled = !options.length

  return (
    <>
      <FormRow label={value?.platform}>
        <Dropdown
          options={options}
          value={[value?.file]}
          disabled={disabled}
          placeholder={
            disabled ? 'No packages for platform' : 'Select a dependency package file...'
          }
          onChange={onChange}
          onClear={() => onChange([])}
        />
      </FormRow>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 16,
        }}
      >
        <Button onClick={onCancel}>Cancel</Button>
        <SaveButton active={value?.file !== initPackage} saving={isUpdating} onClick={onSubmit}>
          Update Bundle Package
        </SaveButton>
      </div>
    </>
  )
}

export default BundleDepsPicker
