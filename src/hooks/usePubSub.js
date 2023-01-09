import { useEffect } from 'react'
import PubSub from '/src/pubsub'

const usePubSub = (topic, callback, ids) => {
  const handlePubSub = (topicName, message) => {
    if (ids && !ids.includes(message?.summary?.entityId)) return
    console.log('WS Version Refetch', topicName)

    callback(topicName, message)
  }

  useEffect(() => {
    const token = PubSub.subscribe(topic, handlePubSub)
    return () => PubSub.unsubscribe(token)
  }, [ids])
}

export default usePubSub
