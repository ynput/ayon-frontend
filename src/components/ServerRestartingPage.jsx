import LoadingPage from '@pages/LoadingPage'
import { useContext } from 'react'
import { SocketContext } from '@context/WebsocketContext'

const ServerRestartingPage = ({ message, active }) => {
  const serverIsRestarting = useContext(SocketContext)?.serverRestartingVisible || false

  if (!serverIsRestarting && !active) return null

  return (
    <>
      <LoadingPage message={message} />
    </>
  )
}

export default ServerRestartingPage
