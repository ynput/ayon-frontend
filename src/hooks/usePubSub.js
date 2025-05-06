import { debounce } from 'lodash'
import { useEffect } from 'react'
import { PubSub } from '@shared/util'

const usePubSub = (topic, callback, ids, config = {}) => {
  const { acceptNew = false, disableDebounce = false, deps = [] } = config
  const handlePubSub = (topicName, message) => {
    if (ids && !ids.includes(message?.summary?.entityId) && !acceptNew) return
    console.log('WS Version Refetch', topicName)

    callback(topicName, message)
  }

  const handlePubSubDebounce = debounce(
    (topicName, message) => handlePubSub(topicName, message),
    100,
  )

  useEffect(() => {
    const token = PubSub.subscribe(topic, disableDebounce ? handlePubSub : handlePubSubDebounce)
    return () => PubSub.unsubscribe(token)
  }, [ids, ...deps])
}

export default usePubSub
