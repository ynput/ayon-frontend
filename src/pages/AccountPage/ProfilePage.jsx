import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import {
  FormRow,
  Section,
  Panel,
  LockedInput,
  SaveButton,
  InputText,
  InputSwitch,
} from '@ynput/ayon-react-components'
import { useUpdateUserMutation, useSetFrontendPreferencesMutation } from '@shared/api'
import Avatar from '@components/Avatar/Avatar'
import styled from 'styled-components'
import UserAttribForm from '../SettingsPage/UsersSettings/UserAttribForm'
import SetPasswordDialog from '../SettingsPage/UsersSettings/SetPasswordDialog'
import ayonClient from '../../ayon'
import Type from '@/theme/typography.module.css'
import { getRequestErrorString } from '@shared/util'
import { updateUserAttribs, updateUserPreferences } from '@state/user'
import { useDispatch } from 'react-redux'
import { useNotifications } from '@context'
import clsx from 'clsx'
import { AvatarName } from './ProfilePage.styled'

const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: var(--base-gap-small);
  display: flex;
  flex-direction: column;
  max-width: 600px;

  & > *:last-child {
    /* flex: 1; */
  }

  .label {
    min-width: 170px;
  }
`

const initialPreferences = {
  notifications: false,
  notificationSound: false,
  flatSettingsLayout: false,
}

const ProfilePage = ({ user = {}, isLoading }) => {
  const dispatch = useDispatch()
  const attributes = useMemo(() => ayonClient.getAttribsByScope('user'), [])
  const [showSetPassword, setShowSetPassword] = useState(false)

  // UPDATE USER DATA
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()

  // build initial form data
  const initialFormData = useMemo(
    () => Object.fromEntries(attributes.map((attrib) => [attrib.name, ''])),
    [attributes],
  )

  const [name, setName] = useState('')
  const [password] = useState('randompasswor')
  const [initData, setInitData] = useState(initialFormData)
  const [formData, setFormData] = useState(initialFormData)
  const [changesMade, setChangesMade] = useState(false)
  const userName = user?.attrib?.fullName || user?.name

  // once user data is loaded, set form data
  useEffect(() => {
    if (user && !isLoading) {
      const { attrib } = user

      const newFormData = {}
      attributes.forEach((att) => {
        newFormData[att.name] = attrib[att.name] || ''
      })

      setFormData(newFormData)
      // used to reset form
      setInitData(newFormData)

      // // set name
      setName(user.name)
    }

    return () => {
      // reset forms
      setFormData(initialFormData)
      setName('')
    }
  }, [attributes, initialFormData, isLoading, user])

  // look for changes when formData changes
  useEffect(() => {
    const isDiff = JSON.stringify(formData) !== JSON.stringify(initData)

    if (isDiff) {
      if (!changesMade) setChangesMade(true)
    } else {
      setChangesMade(false)
    }
  }, [changesMade, formData, initData])

  const onSave = async () => {
    const trimmedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    )
    const attrib = {
      ...user.attrib,
      ...trimmedFormData,
      developerMode: !!user.attrib.developerMode,
    }

    try {
      await updateUser({
        name: user.name,
        patch: {
          attrib,
        },
      }).unwrap()

      // update redux state with new data
      dispatch(updateUserAttribs(formData))
      // reset form
      setInitData(formData)
      setChangesMade(false)
      toast.success('Profile updated')
    } catch (error) {
      console.log(error)
      toast.error('Unable to update profile')
      toast.error(getRequestErrorString(error))
    }
  }

  // USER PREFERENCES
  const [updatePreferences, { isLoading: isUpdatingPreferences }] =
    useSetFrontendPreferencesMutation()

  const initPreferencesData = useRef(initialPreferences)
  const [preferencesData, setPreferencesData] = useState(initialPreferences)
  const preferenceChanges =
    JSON.stringify(preferencesData) !== JSON.stringify(initPreferencesData.current)

  // once user data is loaded, set form data
  useEffect(() => {
    if (user && !isLoading) {
      const { data = {} } = user

      const newPreferencesData = {
        notifications: data.frontendPreferences?.notifications,
        notificationSound: data.frontendPreferences?.notificationSound,
        flatSettingsLayout: !!data.frontendPreferences?.flatSettingsLayout,
      }

      setPreferencesData(newPreferencesData)
      // used to reset form and detect changes
      initPreferencesData.current = newPreferencesData
    }

    return () => {
      // reset forms
      initPreferencesData.current = initialPreferences
      setPreferencesData(initialPreferences)
    }
  }, [isLoading, user])

  const { sendNotification } = useNotifications()

  const onSavePreferences = async () => {
    try {
      await updatePreferences({
        userName: user.name,
        patchData: preferencesData,
      }).unwrap()

      dispatch(updateUserPreferences(preferencesData))
      // reset form
      initPreferencesData.current = preferencesData

      // if the user has enabled notifications for the first time, ask for permission
      if (preferencesData.notifications && Notification.permission !== 'granted') {
        const granted = await sendNotification({
          title: 'Notifications already enabled 💪',
          link: '/account/profile',
        })

        if (!granted) {
          // something went wrong, undo the change to turn notifications off
          await updatePreferences({
            userName: user.name,
            patchData: { notifications: false },
          }).unwrap()
        }
      }
    } catch {
      toast.error('Unable to update preferences')
    }
  }

  const handleChangePreferences = (e) => {
    const { id, checked } = e.target

    setPreferencesData({
      ...preferencesData,
      [id]: checked,
    })
  }

  const handleSaveAll = async () => {
    if (changesMade) await onSave()
    if (preferenceChanges) await onSavePreferences()
  }

  const notificationsDisabled =
    window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' // disable if not on HTTPS or localhost
  const notificationsTooltip = notificationsDisabled
    ? 'Browser notifications only work over HTTPS'
    : 'Get notifications on your device'

  return (
    <main>
      <Section style={{ paddingTop: 16 }}>
        <FormsStyled>
          <Avatar user={user} />
          <AvatarName className={clsx({ loading: !userName || isLoading }, 'shimmer-lightest')}>
            <span className={Type.headlineMedium}>{userName ? userName : 'User FullName'}</span>
          </AvatarName>
          <Panel style={{ background: 'none' }}>
            <FormRow label="Username" key="Username">
              <InputText value={name} disabled />
            </FormRow>
            <UserAttribForm
              formData={formData}
              setFormData={setFormData}
              attributes={attributes}
              showAvatarUrl={false}
            />

            {!user?.data?.disablePasswordLogin && (
              <FormRow label="Password" key="Password">
                <LockedInput
                  label="Password"
                  value={password}
                  type="password"
                  onEdit={() => setShowSetPassword(true)}
                />
              </FormRow>
            )}

            <FormRow label="Desktop Notifications" key="notifications">
              <div data-tooltip={notificationsTooltip} style={{ width: 'fit-content' }}>
                <InputSwitch
                  checked={preferencesData.notifications}
                  id={'notifications'}
                  onChange={handleChangePreferences}
                  disabled={isUpdatingPreferences || isLoading || notificationsDisabled}
                />
              </div>
            </FormRow>

            <FormRow label="Notification Sound" key="notificationSound">
              <div
                data-tooltip="Get a little chime sound on new important notifications"
                style={{ width: 'fit-content' }}
              >
                <InputSwitch
                  checked={preferencesData.notificationSound}
                  id={'notificationSound'}
                  onChange={handleChangePreferences}
                  disabled={isUpdatingPreferences || isLoading}
                />
              </div>
            </FormRow>

            <FormRow label="Flat settings layout" key="flatSettingsLayout">
              <div
                data-tooltip="Show settings as one flat sheet of cards instead of nested panels"
                style={{ width: 'fit-content' }}
              >
                <InputSwitch
                  checked={preferencesData.flatSettingsLayout}
                  id={'flatSettingsLayout'}
                  onChange={handleChangePreferences}
                  disabled={isUpdatingPreferences || isLoading}
                />
              </div>
            </FormRow>

            <SaveButton
              onClick={handleSaveAll}
              label="Save profile"
              active={changesMade || preferenceChanges}
              saving={isUpdatingUser || isUpdatingPreferences}
              style={{ padding: '6px 18px', marginLeft: 'auto' }}
            />
          </Panel>
        </FormsStyled>
      </Section>
      {showSetPassword && (
        <SetPasswordDialog
          selectedUsers={[user?.name]}
          onHide={() => {
            setShowSetPassword(false)
          }}
          disabled={isLoading}
        />
      )}
    </main>
  )
}

export default ProfilePage
