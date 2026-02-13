import { InputText } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import * as Styled from './CreateUser.styled'
import { useInitializeUserMutation } from '@queries/onBoarding/onBoarding'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { login } from '@state/user'
import api from '@shared/api'
import { upperFirst } from 'lodash'
import Type from '@/theme/typography.module.css'

export const CreateUser = ({ Header, Footer, userForm, setUserForm, userFormFields }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [errorMessage, setErrorMessage] = useState('')
  const [formValid, setFormValid] = useState(false)
  const [initializeUser, { isLoading }] = useInitializeUserMutation()

  const validateForm = (newForm, isSubmit) => {
    // username, password, confirmPassword are required
    // password and confirmPassword must match
    // email must be valid
    const requiredFields = ['name', 'password', 'confirmPassword']
    for (const field of requiredFields) {
      if (!newForm[field]) {
        const fieldLabel = userFormFields.find((f) => f.id === field)?.label
        isSubmit && setErrorMessage(`${fieldLabel} is missing`)
        return false
      }
    }

    if (newForm.password !== newForm.confirmPassword && isSubmit) {
      isSubmit && setErrorMessage('Password and Confirm Password do not match')
      return false
    }

    if (newForm.email && !newForm.email.includes('@') && isSubmit) {
      isSubmit && setErrorMessage('Email must be valid')
      return false
    }

    if (isSubmit && newForm.name.includes(' ')) {
      isSubmit && setErrorMessage('Username must not contain any spaces')
      // replace spaces with "."
      const newName = newForm.name.replaceAll(' ', '.')
      setUserForm({ ...newForm, name: newName })
      return false
    }

    setErrorMessage('')
    return true
  }

  const handleInputChange = (event) => {
    const { id, value } = event.target
    const newForm = { ...userForm, [id]: value }
    setUserForm(newForm)
    setFormValid(validateForm(newForm, false))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    // handle userForm submission
    const trimmedForm = { ...userForm, email: userForm.email?.trim() }
    setUserForm(trimmedForm)

    const isValid = validateForm(trimmedForm, true)
    if (!isValid) return

    // add "admin" to all keys and remove confirmPassword
    const formatedForm = Object.keys(trimmedForm).reduce((acc, key) => {
      if (key === 'confirmPassword') return acc
      acc[`admin${upperFirst(key)}`] = trimmedForm[key]
      return acc
    }, {})

    try {
      const response = await initializeUser(formatedForm).unwrap()

      console.log('admin user created')

      if (response.error) throw { data: { detail: response.error } }

      // navigate to dashboard
      navigate('/manageProjects')

      dispatch(
        login({
          user: response.user,
          accessToken: response.token,
        }),
      )
      // invalidate all rtk queries cache
      dispatch(api.util.resetApiState())
    } catch (error) {
      console.log(error)
      setErrorMessage(error.data?.detail || 'Unable to create admin')
    }
  }

  const autoFocus = userForm.name ? 1 : 0

  return (
    <Styled.Wrapper>
      <Styled.Form onSubmit={handleSubmit}>
        <Header>Create Admin</Header>
        {userFormFields.map((field, i) => (
          <Styled.FormRow key={field.id}>
            <label className={Type.labelLarge} htmlFor={field.id}>
              {field.label}
            </label>
            <InputText
              {...field}
              value={userForm[field.id] || ''}
              onChange={handleInputChange}
              autoFocus={!!(i === autoFocus)}
            />
          </Styled.FormRow>
        ))}
      </Styled.Form>
      <Footer
        onNext={handleSubmit}
        nextProps={{ active: formValid, saving: isLoading }}
        next="Create Admin"
      />
      {errorMessage && <Styled.Error>{errorMessage}</Styled.Error>}
    </Styled.Wrapper>
  )
}

export default CreateUser
