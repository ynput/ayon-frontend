import {
  Divider,
  FormLayout,
  FormRow,
  InputText,
  Panel,
  Section,
} from '@ynput/ayon-react-components'
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
  isDev,
  installers = [],
  children,
  selectedAddons,
  setSelectedAddons,
  onAddonDevChange,
}) => {
  const showNameError = formData && !formData?.name && isNew

  const installerPlatforms = installers.find(
    (i) => i.version === formData?.installerVersion,
  )?.platforms

  if (!formData) return null

  return (
    <Panel style={{ flexGrow: 1, overflow: 'hidden' }}>
      <FormLayout style={{ gap: 8, paddingTop: 1, maxWidth: 900 }}>
        <FormRow label="Name">
          {isNew ? (
            <InputText
              value={formData?.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={showNameError ? { outline: '1px solid var(--color-hl-error)' } : {}}
              disabled={!formData || isDev}
            />
          ) : (
            <h2 style={{ margin: 0 }}>{formData?.name}</h2>
          )}
        </FormRow>
        <FormRow label="Launcher version">
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
      <StyledColumns style={{ maxWidth: 1500 }}>
        <section style={{ height: '100%', minWidth: 500, flex: 1 }}>
          <h2>Addons</h2>
          <section style={{ height: '100%' }}>
            <AddonList
              readOnly={!isNew}
              {...{ formData, setFormData }}
              setSelected={setSelectedAddons}
              selected={selectedAddons}
              isDev={isDev}
              onDevChange={onAddonDevChange}
            />
          </section>
        </section>
        <Section style={{ overflow: 'hidden', alignItems: 'flex-start', flex: 'none' }}>
          {children}
        </Section>
      </StyledColumns>
    </Panel>
  )
}

export default BundleForm
