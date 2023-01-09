import { useEffect } from 'react'
import PubSub from '/src/pubsub'

const usePubSub = (topic, id = [], callback) => {
  const handlePubSub = (topicName, message) => {
    if (!id.includes(message.summary.entityId)) return
    console.log('WS Version Refetch', topicName)

    callback()
  }

  useEffect(() => {
    const token = PubSub.subscribe(topic, handlePubSub)
    return () => PubSub.unsubscribe(token)
  }, [id])
}

export default usePubSub
