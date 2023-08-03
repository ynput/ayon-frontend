import { InputText, SaveButton } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import { useGetInfoQuery } from '/src/services/auth/getAuth'
import * as Styled from './CreateUserPage.styled'
import LoadingPage from '../LoadingPage'

const formFields = [
  {
    id: 'name',
    label: 'Username',
    type: 'text',
    required: true,
  },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    required: true,
  },
  {
    id: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    required: true,
  },
  {
    id: 'email',
    label: 'Email (optional)',
    type: 'email',
  },
  {
    id: 'fullName',
    label: 'Full Name (optional)',
    type: 'text',
  },
]

const CreateUserPage = ({ isAdmin }) => {
  const { data: info = {}, isLoading: isLoadingInfo } = useGetInfoQuery()
  const { loginPageBackground = '' } = info
  const [errorMessage, setErrorMessage] = useState('')
  const [formValid, setFormValid] = useState(false)

  const initForm = formFields.reduce((acc, field) => {
    acc[field.id] = ''
    return acc
  }, {})

  const [form, setForm] = useState(initForm)

  if (isLoadingInfo) return <LoadingPage />

  const validateForm = (newForm, isSubmit) => {
    // username, password, confirmPassword are required
    // password and confirmPassword must match
    // email must be valid
    const requiredFields = ['name', 'password', 'confirmPassword']
    for (const field of requiredFields) {
      if (!newForm[field]) {
        const fieldLabel = formFields.find((f) => f.id === field)?.label
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
      setForm({ ...newForm, name: newName })
      return false
    }

    console.log('valid')
    setErrorMessage('')
    return true
  }

  const handleInputChange = (event) => {
    const { id, value } = event.target
    const newForm = { ...form, [id]: value }
    setForm(newForm)
    setFormValid(validateForm(newForm, false))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // handle form submission
    const isValid = validateForm(form, true)
    if (!isValid) return
  }

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <Styled.Panel>
        <Styled.Ayon src="/AYON.svg" />
        <Styled.Form onSubmit={handleSubmit}>
          <h1>Create first admin user</h1>
          {formFields.map((field) => (
            <Styled.FormRow key={field.id}>
              <label htmlFor={field.id}>{field.label}</label>
              <InputText {...field} value={form[field.id] || ''} onChange={handleInputChange} />
            </Styled.FormRow>
          ))}
          <SaveButton className="save" active={formValid}>
            Create {isAdmin ? 'Admin' : 'User'}
          </SaveButton>
          {errorMessage && <Styled.Error>{errorMessage}</Styled.Error>}
        </Styled.Form>
      </Styled.Panel>
    </main>
  )
}

export default CreateUserPage
