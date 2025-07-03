import usePubSub from '@hooks/usePubSub'
import { FC } from 'react'

interface ProjectPubSubProps {
  projectName: string
  onReload: () => void
}

const ProjectPubSub: FC<ProjectPubSubProps> = ({ onReload, projectName }) => {
  const handlePubSub = async (topic: string, message: any) => {
    if (topic === 'client.connected') {
      console.log('ProjectPage: client.connected. Reloading project data')
      onReload()
    } else if (topic === 'entity.project.changed' && message.project === projectName) {
      onReload()
    } else {
      console.log('ProjectPage: Unhandled pubsub message', topic, message)
    }
  }

  usePubSub('client.connected', handlePubSub)
  usePubSub('entity.project', handlePubSub)

  return null
}

export default ProjectPubSub
