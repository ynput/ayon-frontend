import { getBundleModeFromUser, useStagingModeState, BundleMode } from '@shared/util'
import { useAppDispatch, useAppSelector } from '@state/store'
import { toggleDevMode, updateUserPreferences } from '@state/user'
import { FC, useMemo } from 'react'
import { DeveloperSwitch } from './DeveloperSwitch'
import { toast } from 'react-toastify'
import { useUpdateUserMutation } from '@shared/api'
import { DefaultItemTemplate, Dropdown } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

const modeColorVariables = css`
  --bg-color: var(--md-sys-color-surface-container-highest);
  --bg-color-hover: var(--md-sys-color-surface-container-highest-hover);
  --text-color: var(--md-sys-color-on-surface);

  &.developer {
    --bg-color: var(--color-hl-developer-container);
    --bg-color-hover: var(--color-hl-developer-container-hover);
    --text-color: var(--color-hl-developer);
  }

  &.staging {
    --bg-color: var(--color-hl-staging-container);
    --bg-color-hover: var(--color-hl-staging-container-hover);
    --text-color: var(--color-hl-staging);
  }
`

const StyledDropdown = styled(Dropdown)`
  button {
    background-color: unset !important;
  }
`

const StyledDropdownValue = styled.div`
  display: flex;
  align-items: center;
  border-radius: var(--border-radius-l);
  padding: 4px 8px;
  user-select: none;

  ${modeColorVariables}

  background-color: var(--bg-color);
  color: var(--text-color);

  &:hover {
    background-color: var(--bg-color-hover);
  }
`

const StyledModeChip = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;

  ${modeColorVariables}

  background-color: var(--text-color);
`

interface BundleModeSelectorProps {}

const BundleModeSelector: FC<BundleModeSelectorProps> = ({}) => {
  const user = useAppSelector((state) => state.user)
  const dispatch = useAppDispatch()
  const [updateUser] = useUpdateUserMutation()

  // Get developer states
  const isDeveloper = (user?.data as any)?.isDeveloper
  const developerMode = user?.attrib.developerMode

  // is staging is stored in localStorage
  // NOTE: the field is called isStagingEnabled in the user data but in graphql it is called isStagingAllowed
  const isStaging = (user?.data as any)?.isStagingEnabled

  const [stagingMode, setStagingMode] = useStagingModeState(
    user as any, // update redux user state
    (newPreferences) => dispatch(updateUserPreferences(newPreferences)),
  )

  const handleDeveloperMode = async () => {
    try {
      const newDeveloperMode = !developerMode
      // optimistic update the switch
      dispatch(toggleDevMode(newDeveloperMode))

      await updateUser({
        name: user.name,
        patch: {
          attrib: { developerMode: newDeveloperMode },
        },
      }).unwrap()

      // if the request fails, revert the switch
    } catch (error) {
      console.error(error)
      const errorMessage = (error as any)?.details || 'Unknown error'
      toast.error('Unable to update developer mode: ' + errorMessage)
      // reset switch on error
      dispatch(toggleDevMode(developerMode))
    }
  }

  const bundleMode = getBundleModeFromUser(user as any)

  const handleBundleModeChange = async (mode: BundleMode) => {
    const isDev = mode === 'developer'
    const isStag = mode === 'staging'

    const promises = []

    try {
      if (developerMode !== isDev) {
        dispatch(toggleDevMode(isDev))
        promises.push(
          updateUser({
            name: user.name,
            patch: {
              attrib: { developerMode: isDev },
            },
          }).unwrap(),
        )
      }

      if (stagingMode !== isStag) {
        promises.push(setStagingMode(isStag))
      }

      await Promise.all(promises)
    } catch (error) {
      console.error(error)
      toast.error('Failed to update bundle mode')
    }
  }

  const options = useMemo(
    () => [
      { label: 'Production', value: 'production' },
      { label: 'Staging', value: 'staging' },
      { label: 'Developer', value: 'developer' },
    ],
    [],
  )

  if (isDeveloper && isStaging) {
    const renderValue = (value: string[]) => {
      const mode = value[0] as BundleMode

      const label =
        mode === 'developer'
          ? 'Developer Mode'
          : mode === 'staging'
          ? 'Staging Mode'
          : 'Set bundle mode'

      return <StyledDropdownValue className={mode}>{label}</StyledDropdownValue>
    }

    const renderItem = (option: any) => {
      return (
        <DefaultItemTemplate
          option={option}
          dataKey={'value'}
          labelKey={'label'}
          value={[option.value]}
          selected={[bundleMode]}
          startContent={<StyledModeChip className={option.value} />}
        />
      )
    }

    return (
      <StyledDropdown
        options={options}
        value={[bundleMode]}
        valueTemplate={renderValue}
        itemTemplate={renderItem}
        onChange={(v) => handleBundleModeChange(v[0] as BundleMode)}
      />
    )
  }

  return (
    <>
      {isDeveloper && <DeveloperSwitch value={developerMode} onChange={handleDeveloperMode} />}
      {isStaging && (
        <DeveloperSwitch
          value={stagingMode}
          onChange={setStagingMode}
          variant={'staging'}
          label={'Staging Mode'}
        />
      )}
    </>
  )
}

export default BundleModeSelector
