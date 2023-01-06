import axios from 'axios'
import { useEffect, useState, createContext } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import PubSub from '/src/pubsub'
import { arrayEquals } from '/src/utils'
import useWebSocket, { ReadyState } from 'react-use-websocket'

export const SocketContext = createContext()

const proto = window.location.protocol.replace('http', 'ws')
const wsAddress = `${proto}//${window.location.host}/ws`
const wsOpts = {
  shouldReconnect: () => true,
}

export const SocketProvider = (props) => {
  const [serverRestartingVisible, setServerRestartingVisible] = useState(false)
  const [topics, setTopics] = useState([])
  const { sendMessage, readyState, getWebSocket } = useWebSocket(wsAddress, wsOpts)
  const context = useSelector((state) => state.context)
  const projectName = context.projectName

  const subscribe = () => {
    sendMessage(
      JSON.stringify({
        topic: 'auth',
        token: localStorage.getItem('accessToken'),
        subscribe: topics,
        project: projectName,
      }),
    )
  }

  useEffect(() => {
    console.log('Topics changed', topics)
    subscribe()
  }, [topics, projectName])

  PubSub.setOnSubscriptionsChange((newTopics) => {
    if (arrayEquals(topics, newTopics)) return
    console.log('WS: Subscriptions changed')
    setTopics(newTopics)
  })

  const onMessage = (message) => {
    const data = JSON.parse(message.data)
    if (data.topic === 'heartbeat') return

    if (data.topic === 'server.restart_requested') setServerRestartingVisible(true)

    if (data.sender === axios.defaults.headers.common['X-Sender']) {
      return // my own message. ignore
    }
    if (data.topic === 'shout' && data?.summary?.text) toast.info(data.summary.text)

    console.log('Event RX', data)
    PubSub.publish(data.topic, data)
  }

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      setServerRestartingVisible(false)
      getWebSocket().onmessage = onMessage
      subscribe()
      // Dispatch a fake event to the frontend components
      // in case they depend on the event stream and may
      // miss some messages - this should force reloading
      // events using graphql
      PubSub.publish('client.connected', {
        topic: 'client.connected',
      })
    }
  }, [readyState, getWebSocket])

  return (
    <SocketContext.Provider
      value={{
        getWebSocket,
        serverRestartingVisible,
      }}
    >
      {props.children}
    </SocketContext.Provider>
  )
}
