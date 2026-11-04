import { Button, Icon } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from '@state/store'
import { updateUserPreferences } from '@state/user'
import { useSetFrontendPreferencesMutation } from '@shared/api'
import { getRequestErrorString } from '@shared/util'
import { useThemePreference } from '@hooks/useAppTheme'
import type { ThemePreference } from '@helpers/theme'
import * as Styled from './UserMenu.styled'

const OPTIONS = [
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'system', label: 'System', icon: 'computer' },
] as const satisfies readonly { value: ThemePreference; label: string; icon: string }[]

const ThemeSwitcher = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.user)
  const current = useThemePreference()
  const [setFrontendPreferences] = useSetFrontendPreferencesMutation()

  const handleChange = async (theme: ThemePreference) => {
    if (theme === current) return
    // useAppTheme applies it straight away, the save makes it follow the user to other browsers
    dispatch(updateUserPreferences({ theme }))
    if (user.data?.isGuest) return
    try {
      await setFrontendPreferences({
        userName: user.name,
        patchData: { theme },
        // @ts-expect-error - disableInvalidations is not in the api
        disableInvalidations: true,
      }).unwrap()
    } catch (error) {
      toast.error(`Unable to save the theme: ${getRequestErrorString(error)}`)
    }
  }

  return (
    <Styled.Theme>
      <Styled.ThemeLabel>
        <Icon icon="contrast" />
        Theme
      </Styled.ThemeLabel>
      <Styled.ThemeOptions role="radiogroup" aria-label="Theme">
        {OPTIONS.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant="text"
            icon={icon}
            label={label}
            role="radio"
            aria-checked={value === current}
            className={clsx({ selected: value === current })}
            onClick={() => handleChange(value)}
          />
        ))}
      </Styled.ThemeOptions>
    </Styled.Theme>
  )
}

export default ThemeSwitcher
