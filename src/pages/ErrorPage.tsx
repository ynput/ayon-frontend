import { FC } from 'react'

type ErrorPageProps = {
  code?: string
  message?: string
  links?: React.ReactNode[]
}

const ErrorPage: FC<ErrorPageProps> = ({ code, message, links }) => {
  return (
    <main className="center">
      <h1>ERROR {code}</h1>
      {message && <h2>{message}</h2>}
      {links &&
        links.map((link, idx) => {
          return <span key={idx}>{link}</span>
        })}
    </main>
  )
}

export default ErrorPage
