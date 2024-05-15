import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import {
  FormRow,
  Section,
  Panel,
  LockedInput,
  SaveButton,
  InputText,
} from '@ynput/ayon-react-components'
import { useUpdateUserMutation, useUpdateUserAvatarMutation } from '../../services/user/updateUser'
import Avatar from '../../components/Avatar/Avatar'
import styled from 'styled-components'
import UserAttribForm from '../SettingsPage/UsersSettings/UserAttribForm'
import SetPasswordDialog from '../SettingsPage/UsersSettings/SetPasswordDialog'
import ayonClient from '../../ayon'
import { onProfileUpdate } from '../../features/user'
import Type from '/src/theme/typography.module.css'
import { useDispatch } from 'react-redux'

const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: 4px;
  display: flex;
  flex-direction: column;
  max-width: 600px;

  & > *:last-child {
    /* flex: 1; */
  }
`

export const PanelButtonsStyled = styled(Panel)`
  flex-direction: row;

  & > * {
    flex: 1;
  }
`

const ProfilePage = ({ user = {}, isLoading }) => {
  const dispatch = useDispatch()
  const attributes = ayonClient.getAttribsByScope('user')
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [userImage, setUserImage] = useState(false)

  // UPDATE USER DATA
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
  const [updateUserAvatar] = useUpdateUserAvatarMutation()

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
    const attrib = {
      ...user.attrib,
      ...formData,
      developerMode: !!user.attrib.developerMode,
    }

    try {
      await updateUser({
        name: user.name,
        patch: {
          attrib,
        },
      }).unwrap()

      toast.success('Profile updated')

      // update redux state with new data
      dispatch(onProfileUpdate(formData))
      // reset form
      setInitData(formData)
      setChangesMade(false)
    } catch (error) {
      console.log(error)
      toast.error('Unable to update profile')
      toast.error(error.details)
    }
  }


  const onUpdateAvatar = async (file) => {


    try {

      const user_name = user.name
      const opts = {
        headers: {
          'Content-Type': file.type,
        },
      }

      const res = await axios.put(`/api/users/${user_name}/avatar`, file, opts)
      console.log(res,'res')

      toast.success('Profile updated')
      // update redux state with new data
      dispatch(onProfileUpdate(formData))
      // reset form
      setInitData(formData)
      setChangesMade(false)
    } catch (error) {
      console.log(error)
      toast.error('Unable to update avatar')
      toast.error(error.details)
    }
  }

  const loadImage = () => {
    axios.get(`/api/users/${user.name}/avatar`).then((response) => {
      setUserImage(response)
    })
  }

  function convertRawToBase64(rawData) {
    const buffer = new TextEncoder().encode(rawData);
     return btoa(String.fromCharCode(...buffer))
    
  }

  function createDataUri(base64Data, mimeType) {
    return `data:${mimeType};base64,${base64Data}`;
  }

  const base64Data = convertRawToBase64(userImage);
  const dataUri = createDataUri(base64Data, "image/png");

  console.log(userImage,'userImage')
  console.log(base64Data,'base64Data')
  console.log(dataUri,'dataUri')

  // const encodedString = "your_base64_string_here";
  // const decodedBytes = Uint8Array.from(atob(encodedString), c => c.charCodeAt(0));
  // const blob = new Blob([decodedBytes], { type: "image/jpeg" });
  // const url = URL.createObjectURL(blob);



  // const fileInput = useRef(null)

  return (
    <main>
      <Section style={{ paddingTop: 16 }}>
        {/* <UserDetailsHeader users={[user]} style={{ maxWidth: 600 }} /> */}
        <FormsStyled>
        <Avatar user={user} onUpdateAvatar={onUpdateAvatar} />
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>

          <span style={{ padding: 16 }} className={Type.headlineMedium}>{user?.attrib?.fullName}</span>
          <button onClick={loadImage}>load image</button>
          {dataUri && <img src={dataUri || ''} alt="Image from Server" />}
        </div>
          <Panel>
            <FormRow label="Username" key="Username">
              <InputText value={name} disabled />
            </FormRow>
            <UserAttribForm
              formData={formData}
              setFormData={setFormData}
              attributes={attributes}
              onUpdateAvatar={onUpdateAvatar} />
            <FormRow label="Password" key="Password">
              <LockedInput
                label="Password"
                value={password}
                type="password"
                onEdit={() => setShowSetPassword(true)}
              />
            </FormRow>
            <SaveButton
              onClick={onSave}
              label="Save profile"
              active={changesMade}
              saving={isUpdatingUser}
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
