import * as Styled from './LoginPage.styled'

const LoginTerms = () => {
  return (
    <Styled.TandCs>
      By logging in you agree to our{' '}
      <a href={'https://ynput.io/terms/'} target="_blank">
        Terms of Service
      </a>{' '}
      and{' '}
      <a href={'https://ynput.io/privacy-policy'} target="_blank">
        Privacy Policy
      </a>
    </Styled.TandCs>
  )
}

export default LoginTerms
