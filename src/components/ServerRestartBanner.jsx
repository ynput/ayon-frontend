import LoadingPage from '../pages/LoadingPage'
import { useContext } from 'react'
import { SocketContext } from '../context/websocketContext'

const ServerRestartBanner = ({ message, active }) => {
  const serverIsRestarting = useContext(SocketContext)?.serverRestartingVisible || false

  if (!serverIsRestarting && !active) return null

  return (
    <>
      <LoadingPage message={message} />
    </>
  )
}

export default ServerRestartBanner
