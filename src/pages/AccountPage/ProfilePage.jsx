import { useEffect, useState } from 'react'
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
import { usePowerpack } from '@shared/context'
import { useContributions } from '@ynput/ayon-addon'
import { AddonProfileSections } from '@shared/components'
import { PersonalApiKeysPreview } from './PersonalApiKeysPreview'
import clsx from 'clsx'
import { AvatarName } from './ProfilePage.styled'
import { DividerSmallStyled } from '../SettingsPage/UsersSettings/UserAttribForm.styled'

const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: var(--base-gap-small);
  display: flex;
  flex-direction: column;
  width: 100%;
  /* two 600px columns and the gap between them */
  max-width: 1232px;

  .label {
    min-width: 170px;
  }

  /* every card's header (AYON's profile and the addon sections) is as tall as a button, so the
     columns line up whether or not a header has one */
  .profile-card-header {
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
    min-height: var(--base-input-size);
  }
`

// the profile form, and next to it what addons add to the page; below it on narrow screens
const ColumnsStyled = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: var(--base-gap-large) 32px;

  && > * {
    flex: 1 1 400px;
    max-width: 600px;
  }
`

const SideStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);

  /* no addon sections and no preview: the form stays centred on its own */
  &:empty {
    display: none;
  }
`

const ProfilePage = ({ user = {}, isLoading }) => {
  const dispatch = useDispatch()
  const attributes = ayonClient.getAttribsByScope('user')
  const [showSetPassword, setShowSetPassword] = useState(false)

  // UPDATE USER DATA
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()

  // build initial form data
  const initialFormData = {}
  attributes.forEach((attrib) => {
    initialFormData[attrib.name] = ''
  })

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
  }, [isLoading, user])

  // look for changes when formData changes
  useEffect(() => {
    const isDiff = JSON.stringify(formData) !== JSON.stringify(initData)

    if (isDiff) {
      if (!changesMade) setChangesMade(true)
    } else {
      setChangesMade(false)
    }
  }, [formData, initData])

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

  const initPreferences = { notifications: false, notificationSound: false }
  const [initPreferencesData, setInitPreferencesData] = useState(initPreferences)
  const [preferencesData, setPreferencesData] = useState(initPreferences)
  const [preferenceChanges, setPreferenceChanges] = useState(false)

  // once user data is loaded, set form data
  useEffect(() => {
    if (user && !isLoading) {
      const { data = {} } = user

      const newPreferencesData = {
        notifications: data.frontendPreferences?.notifications,
        notificationSound: data.frontendPreferences?.notificationSound,
      }

      setPreferencesData(newPreferencesData)
      // used to reset form and detect changes
      setInitPreferencesData(newPreferencesData)
    }

    return () => {
      // reset forms
      setInitPreferencesData(initPreferences)
      setPreferencesData(initPreferences)
    }
  }, [isLoading, user])

  // look for changes when preferencesData changes
  useEffect(() => {
    const isDiff = JSON.stringify(preferencesData) !== JSON.stringify(initPreferencesData)

    if (isDiff) {
      if (!preferenceChanges) setPreferenceChanges(true)
    } else {
      setPreferenceChanges(false)
    }
  }, [preferencesData, initPreferencesData])

  const { sendNotification } = useNotifications()
  const { powerLicense, isLoading: isLoadingLicense } = usePowerpack()
  const { contributions: profileSections, isLoading: isLoadingSections } =
    useContributions('profile.section')
  const hasPersonalApiKeys = profileSections.some(
    (section) => section.addon.name === 'powerpack' && section.id === 'personalApiKeys',
  )

  const onSavePreferences = async () => {
    setPreferenceChanges(false)
    try {
      await updatePreferences({
        userName: user.name,
        patchData: preferencesData,
      }).unwrap()

      dispatch(updateUserPreferences(preferencesData))
      // reset form
      setInitPreferencesData(preferencesData)

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
    } catch (error) {
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
      <Section
        style={{
          paddingTop: 16,
          backgroundColor: 'var(--panel-background)',
          borderRadius: 'var(--border-radius-m)',
        }}
      >
        <FormsStyled>
          <Avatar user={user} />
          <AvatarName className={clsx({ loading: !userName || isLoading }, 'shimmer-lightest')}>
            <span className={Type.headlineMedium}>{userName ? userName : 'User FullName'}</span>
          </AvatarName>
          <ColumnsStyled>
            <Panel>
              {/* saves this card only: addon sections save their own data */}
              <header className="profile-card-header">
                <b>Profile</b>
                <SaveButton
                  onClick={handleSaveAll}
                  label="Save profile"
                  active={changesMade || preferenceChanges}
                  saving={isUpdatingUser || isUpdatingPreferences}
                  style={{ marginLeft: 'auto' }}
                />
              </header>
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

              <DividerSmallStyled />
              <FormRow label="Desktop notifications" key="notifications">
                <div data-tooltip={notificationsTooltip} style={{ width: 'fit-content' }}>
                  <InputSwitch
                    checked={preferencesData.notifications}
                    id={'notifications'}
                    onChange={handleChangePreferences}
                    disabled={isUpdatingPreferences || isLoading || notificationsDisabled}
                  />
                </div>
              </FormRow>

              <FormRow label="Notification sound" key="notificationSound">
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
            </Panel>
            <SideStyled>
              {/* what addons contribute to this page (profile.section slot, @ynput/ayon-addon) */}
              <AddonProfileSections />
              {!isLoadingLicense &&
                !user?.data?.isGuest &&
                (!powerLicense || (!isLoadingSections && !hasPersonalApiKeys)) && (
                  <PersonalApiKeysPreview needsUpdate={powerLicense} />
                )}
            </SideStyled>
          </ColumnsStyled>
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
