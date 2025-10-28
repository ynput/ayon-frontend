import LoadingPage from '@pages/LoadingPage'
import { useSocketContext } from '@shared/context'

type ServerRestartingPageProps = {
  message: string
  active?: boolean
}

const ServerRestartingPage = ({ message, active }: ServerRestartingPageProps) => {
  const serverIsRestarting = useSocketContext().serverRestartingVisible || false

  if (!serverIsRestarting && !active) return null

  return (
    <>
      <LoadingPage message={message} />
    </>
  )
}

export default ServerRestartingPage
