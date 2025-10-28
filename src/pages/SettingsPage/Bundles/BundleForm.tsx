import { Divider, FormRow as RCFormRow, InputSwitch, InputText } from '@ynput/ayon-react-components'
import React, { useMemo } from 'react'
import BundlesAddonList from './BundlesAddonList'
import * as BundleStyled from './Bundles.styled'
import * as Styled from './BundleForm.styled'
import { upperFirst } from 'lodash'
import InstallerSelector from './InstallerSelector'
import { useAppSelector } from '@state/store'
import { useGetUsersQuery } from '@shared/api'
import type { Addon } from './types'

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
  addons: Addon[]
  onAddonAutoUpdate?: (addon: string, version: string | null) => void
  onProjectSwitchChange?: () => void
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
  addons,
  onAddonAutoUpdate,
  onProjectSwitchChange,
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
    <Styled.StyledPanel>
      <Styled.StyledFormLayout>
        <BundleStyled.FormRow>
          <label htmlFor="bundle-name">Bundle name</label>
          <div className="field">
            {isNew ? (
              <Styled.BundleNameContainer>
                <Styled.BundleNameInput $hasError={!!showNameError}>
                  <InputText
                    value={formData?.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!formData || isDev}
                    id={'bundle-name'}
                  />
                </Styled.BundleNameInput>
                {!isDev && onProjectSwitchChange && (
                  <Styled.ProjectSwitchContainer data-tooltip="A bundle that is used for a specific project (experimental)">
                    <span>Project bundle</span>
                    <InputSwitch
                      checked={formData?.isProject || false}
                      onChange={onProjectSwitchChange}
                      disabled={!formData || formData.isDev}
                    />
                  </Styled.ProjectSwitchContainer>
                )}
              </Styled.BundleNameContainer>
            ) : (
              <Styled.BundleName>{formData?.name}</Styled.BundleName>
            )}
          </div>
        </BundleStyled.FormRow>
        <RCFormRow label="Launcher version">
          {isNew ? (
            <InstallerSelector
              value={formData?.installerVersion ? [formData?.installerVersion] : []}
              options={installers}
              onChange={(e) => setFormData({ ...formData, installerVersion: e[0] })}
              disabled={!formData}
            />
          ) : (
            <Styled.LauncherVersionContainer>
              <Styled.LauncherVersionTitle>
                {formData?.installerVersion || 'NONE'}
              </Styled.LauncherVersionTitle>
              <>
                {!!installerPlatforms?.length &&
                  installerPlatforms.map((platform, i) => {
                    const PlatformTag: any = BundleStyled.PlatformTag
                    return (
                      <PlatformTag key={platform + '-' + i} $platform={platform}>
                        {upperFirst(platform === 'darwin' ? 'macOS' : platform)}
                      </PlatformTag>
                    )
                  })}
              </>
            </Styled.LauncherVersionContainer>
          )}
        </RCFormRow>
        {developerMode && !isDev && (
          <RCFormRow label="Dev bundle">
            <InputSwitch
              checked={formData.isDev}
              onChange={() =>
                setFormData({ ...formData, isDev: !formData.isDev, isProject: false })
              }
            />
          </RCFormRow>
        )}
        {(isDev || developerMode) && (
          <RCFormRow label="Assigned dev" fieldStyle={Styled.DevFieldContainer}>
            {(() => {
              const DevSelect: any = BundleStyled.DevSelect
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
              const BadgeButton: any = BundleStyled.BadgeButton
              return (
                <BadgeButton
                  label="Assign to me"
                  $hl={'developer-surface'}
                  icon={'person_pin_circle'}
                  style={Styled.AssignButtonContainer}
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
      </Styled.StyledFormLayout>
      <Divider />
      <Styled.StyledColumns>
        <Styled.AddonListSection>
          <Styled.AddonListInnerSection>
            <BundlesAddonList
              readOnly={!isNew}
              {...{ formData, setFormData }}
              setSelected={setSelectedAddons}
              selected={selectedAddons}
              isDev={isDev || formData.isDev}
              onDevChange={onAddonDevChange}
              ref={addonListRef}
              addons={addons}
              onAddonAutoUpdate={onAddonAutoUpdate}
            />
          </Styled.AddonListInnerSection>
        </Styled.AddonListSection>
        <Styled.SidebarSection>{children}</Styled.SidebarSection>
      </Styled.StyledColumns>
    </Styled.StyledPanel>
  )
}

export default BundleForm
