import {
  Divider,
  FormLayout,
  FormRow as RCFormRow,
  InputSwitch,
  InputText,
  Panel,
  Section,
} from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import BundlesAddonList from './BundlesAddonList'
import * as Styled from './Bundles.styled'
import { upperFirst } from 'lodash'
import InstallerSelector from './InstallerSelector'
import { useAppSelector } from '@state/store'
import { useGetUsersQuery } from '@shared/api'
import type { Addon } from './types'

const StyledColumns = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  overflow: hidden;
`

type Installer = { version: string; platforms?: string[] }

type BundleFormData = {
  name?: string
  installerVersion?: string
  isProject?: boolean
  isDev?: boolean
  activeUser?: string
  addons?: Record<string, string | null>
  addonDevelopment?: Record<string, { enabled?: boolean; path?: string }>
}

type BundleFormProps = {
  formData: BundleFormData | null
  setFormData: React.Dispatch<React.SetStateAction<BundleFormData>>
  isNew: boolean
  isDev?: boolean
  installers?: Installer[]
  children?: React.ReactNode
  selectedAddons: Addon[]
  setSelectedAddons: (sel: any) => void
  onAddonDevChange?: (
    addonNames: string[],
    payload: { value: any; key: 'enabled' | 'path' },
  ) => void
  developerMode?: boolean
  addonListRef?: any
  onAddonAutoUpdate?: (addon: string, version: string | null) => void
}

const BundleForm: React.FC<BundleFormProps> = ({
  formData,
  setFormData,
  isNew,
  isDev,
  installers = [],
  children,
  selectedAddons,
  setSelectedAddons,
  onAddonDevChange,
  developerMode,
  addonListRef,
  onAddonAutoUpdate,
}) => {
  const showNameError = formData && !formData?.name && isNew
  const currentUser = useAppSelector((state) => state.user.name)
  const { data: users = [], isLoading } = useGetUsersQuery({ selfName: currentUser }) as any
  const devs = users?.filter((u: any) => u.isDeveloper)
  const installerPlatforms = installers.find(
    (i) => i.version === formData?.installerVersion,
  )?.platforms

  const devSelectOptions = useMemo(
    () =>
      devs.map((d: any) => ({
        name: d.name,
        fullName: d.attrib?.fullName || d.name,
        avatarUrl: d.name && `/api/users/${d.name}/avatar`,
      })),
    [devs],
  )

  if (!formData) return null

  return (
    <Panel style={{ flexGrow: 1, overflow: 'hidden' }}>
      <FormLayout style={{ gap: 8, paddingTop: 1, maxWidth: 900 }}>
        <Styled.FormRow>
          <label htmlFor="bundle-name">Bundle name</label>
          <div className="field">
            {isNew ? (
              <InputText
                value={formData?.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={showNameError ? { outline: '1px solid var(--color-hl-error)' } : {}}
                disabled={!formData || isDev}
                id={'bundle-name'}
              />
            ) : (
              <h2 style={{ margin: 0 }}>{formData?.name}</h2>
            )}
          </div>
        </Styled.FormRow>
        <RCFormRow label="Launcher version">
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
                  installerPlatforms.map((platform, i) => {
                    const PlatformTag: any = Styled.PlatformTag
                    return (
                      <PlatformTag key={platform + '-' + i} $platform={platform}>
                        {upperFirst(platform === 'darwin' ? 'macOS' : platform)}
                      </PlatformTag>
                    )
                  })}
              </>
            </div>
          )}
        </RCFormRow>
        {developerMode && !isDev && (
          <RCFormRow label="Dev bundle">
            <InputSwitch
              checked={formData.isDev}
              onChange={() => setFormData({ ...formData, isDev: !formData.isDev })}
            />
          </RCFormRow>
        )}
        {(isDev || developerMode) && (
          <RCFormRow label="Assigned dev" fieldStyle={{ flexDirection: 'row', gap: 8 }}>
            {(() => {
              const DevSelect: any = Styled.DevSelect
              return (
                <DevSelect
                  editor
                  emptyMessage={'Assign developer...'}
                  value={[formData.activeUser || '']}
                  options={devSelectOptions}
                  disabled={isLoading || !formData.isDev}
                  multiSelect={false}
                  onChange={(v: string[]) =>
                    setFormData((prev) => ({
                      ...prev,
                      activeUser: v[0],
                    }))
                  }
                />
              )
            })()}
            {(() => {
              const BadgeButton: any = Styled.BadgeButton
              return (
                <BadgeButton
                  label="Assign to me"
                  $hl={'developer-surface'}
                  icon={'person_pin_circle'}
                  style={{
                    justifyContent: 'center',
                    width: 'auto',
                  }}
                  disabled={formData.activeUser === currentUser || isLoading || !formData.isDev}
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      activeUser: currentUser,
                    }))
                  }}
                />
              )
            })()}
          </RCFormRow>
        )}
      </FormLayout>
      <Divider />
      <StyledColumns style={{ maxWidth: 1500 }}>
        <section style={{ height: '100%', minWidth: 500, flex: 1 }}>
          <section style={{ height: '100%' }}>
            <BundlesAddonList
              readOnly={!isNew}
              {...{ formData, setFormData }}
              setSelected={setSelectedAddons}
              selected={selectedAddons}
              isDev={isDev || formData.isDev}
              onDevChange={onAddonDevChange}
              ref={addonListRef}
              onAddonAutoUpdate={onAddonAutoUpdate}
            />
          </section>
        </section>
        <Section
          style={{
            overflow: 'hidden',
            alignItems: 'flex-start',
            minWidth: 'clamp(300px, 25vw, 400px)',
            maxWidth: 'clamp(300px, 25vw, 400px)',
            height: '100%',
            flexGrow: 'unset',
          }}
        >
          {children}
        </Section>
      </StyledColumns>
    </Panel>
  )
}

export default BundleForm
