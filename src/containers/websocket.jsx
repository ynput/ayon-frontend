import { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import axios from 'axios'
import PubSub from '/src/pubsub'
import { arrayEquals } from '/src/utils'

const wsAddress = `${window.location.protocol.replace('http', 'ws')}//${
  window.location.host
}/ws`

const WebsocketListener = () => {
  const [topics, setTopics] = useState([])

  const { sendMessage, readyState, getWebSocket } = useWebSocket(wsAddress, {
    shouldReconnect: () => true,
  })

  useEffect(() => {
    console.log('Topics changed', topics)
    sendMessage(
      JSON.stringify({
        topic: 'auth',
        token: localStorage.getItem('accessToken'),
        subscribe: topics,
      })
    )
  }, [topics])

  const onMessage = (message) => {
    const data = JSON.parse(message.data)
    if (data.topic === 'heartbeat') return
    if (data.sender === axios.defaults.headers.common['X-Sender']) {
      return // my own message. ignore
    }
    console.log('Event RX', data)
    PubSub.publish(data.topic, data)
  }

  PubSub.setOnSubscriptionsChange((newTopics) => {
    if (arrayEquals(topics, newTopics)) return
    setTopics(newTopics)
  })

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      getWebSocket().onmessage = onMessage
      setTopics([])
    }
  }, [readyState, getWebSocket])

  return <></>
}

export default WebsocketListener
