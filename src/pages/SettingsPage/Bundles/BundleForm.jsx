import { Dropdown, FormLayout, FormRow, InputText, Panel } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'
import AddonList from './AddonList'

const StyledColumns = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  overflow: hidden;
`

const BundleForm = ({
  formData,
  setFormData,
  isNew,
  installerVersions = [],
  children,
  selectedAddons,
  setSelectedAddons,
}) => {
  const showNameError = formData && !formData?.name && isNew

  return (
    <Panel style={{ flexGrow: 1, overflow: 'hidden' }}>
      <FormLayout>
        <FormRow label="Name">
          {isNew ? (
            <InputText
              value={formData?.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={showNameError ? { outline: '1px solid var(--color-hl-error)' } : {}}
              disabled={!formData}
            />
          ) : (
            <h2 style={{ margin: 0 }}>{formData?.name}</h2>
          )}
        </FormRow>
        <FormRow label="Installer version">
          {isNew ? (
            <Dropdown
              value={formData?.installerVersion ? [formData?.installerVersion] : []}
              options={installerVersions}
              onChange={(e) => setFormData({ ...formData, installerVersion: e[0] })}
              disabled={!formData}
              widthExpand
              placeholder={''}
            />
          ) : (
            <h2 style={{ margin: 0 }}>{formData?.installerVersion || 'NONE'}</h2>
          )}
        </FormRow>
      </FormLayout>

      <StyledColumns>
        <section style={{ height: '100%' }}>
          <h2>Addons</h2>
          <section style={{ height: '100%' }}>
            <AddonList
              readOnly={!isNew}
              {...{ formData, setFormData }}
              setSelected={setSelectedAddons}
              selected={selectedAddons}
            />
          </section>
        </section>
        {children}
      </StyledColumns>
    </Panel>
  )
}

export default BundleForm
