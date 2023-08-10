import { Divider, FormLayout, FormRow, InputText, Panel } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'
import AddonList from './AddonList'
import * as Styled from './Bundles.styled'
import { upperFirst } from 'lodash'
import InstallerSelector from './InstallerSelector'

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
  installers = [],
  children,
  selectedAddons,
  setSelectedAddons,
}) => {
  const showNameError = formData && !formData?.name && isNew

  const installerPlatforms = installers.find(
    (i) => i.version === formData?.installerVersion,
  )?.platforms

  return (
    <Panel style={{ flexGrow: 1, overflow: 'hidden' }}>
      <FormLayout style={{ gap: 8, paddingTop: 1, maxWidth: 800 }}>
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
            <InstallerSelector
              value={formData?.installerVersion ? [formData?.installerVersion] : []}
              options={installers}
              onChange={(e) => setFormData({ ...formData, installerVersion: e[0] })}
              disabled={!formData}
            />
          ) : (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <h2 style={{ margin: 0, marginRight: 32 }}>{formData?.installerVersion || 'NONE'}</h2>
              <>
                {!!installerPlatforms?.length &&
                  installerPlatforms.map((platform) => (
                    <Styled.PlatformTag key={platform} $platform={platform}>
                      {upperFirst(platform === 'darwin' ? 'macOS' : platform)}
                    </Styled.PlatformTag>
                  ))}
              </>
            </div>
          )}
        </FormRow>
      </FormLayout>
      <Divider />
      <StyledColumns style={{ maxWidth: isNew ? 800 : 'unset' }}>
        <section style={{ height: '100%', minWidth: 400 }}>
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
