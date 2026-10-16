import { FC } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useNavigate } from 'react-router-dom'

import * as Styled from './ErrorPage.styled'

type ErrorPageProps = {
  code?: string
  message?: string
  links?: React.ReactNode[]
}

const ErrorPage: FC<ErrorPageProps> = ({ code, message, links }) => {
  const isNotFound = code === '404'
  const navigate = useNavigate()

  return (
    <Styled.Page className="center">
      <Styled.Logo src="/AYON.svg" alt="AYON" />
      <Styled.Code>{code || 'ERROR'}</Styled.Code>
      <Styled.Title>
        {message || (isNotFound ? 'Page not found' : 'Something went wrong.')}
      </Styled.Title>
      {isNotFound && (
        <Styled.Description>
          We couldn&apos;t find the page you were looking for.
        </Styled.Description>
      )}
      {isNotFound && (
        <Styled.DashboardButton variant="filled" onClick={() => navigate('/dashboard/tasks')}>
          Return to dashboard
        </Styled.DashboardButton>
      )}
      {links && links.length > 0 && (
        <Styled.Links>
          {links.map((link, idx) => (
            <span key={idx}>{link}</span>
          ))}
        </Styled.Links>
      )}
    </Styled.Page>
  )
}

export default ErrorPage
