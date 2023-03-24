const ErrorPage = ({ code, message, links }) => {
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
