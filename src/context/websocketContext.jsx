import { useEffect, useState, createContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import PubSub from '/src/pubsub'
import arrayEquals from '../helpers/arrayEquals'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { debounce } from 'lodash'
import { ayonApi } from '../services/ayon'

export const SocketContext = createContext()

const proto = window.location.protocol.replace('http', 'ws')
const wsAddress = `${proto}//${window.location.host}/ws`

export const SocketProvider = (props) => {
  const dispatch = useDispatch()
  // get user logged in
  const [serverRestartingVisible, setServerRestartingVisible] = useState(false)
  const [topics, setTopics] = useState([])

  const wsOpts = {
    shouldReconnect: () => {
      setServerRestartingVisible(true)
      return true
    },
  }

  const { sendMessage, readyState, getWebSocket } = useWebSocket(wsAddress, wsOpts)
  const project = useSelector((state) => state.project)
  const projectName = project.name

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

  const updateTopicsDebounce = debounce((newTopics) => {
    if (arrayEquals(topics, newTopics)) return
    console.log('WS: Subscriptions changed')
    setTopics(newTopics)
  }, 200)

  PubSub.setOnSubscriptionsChange((newTopics) => updateTopicsDebounce(newTopics))

  const onMessage = (message) => {
    const data = JSON.parse(message.data)
    if (data.topic === 'heartbeat') return

    if (data.topic === 'server.restart_requested') setServerRestartingVisible(true)

    if (data.sender === window.senderId) {
      return // my own message. ignore
    }
    if (data.topic === 'shout' && data?.summary?.text) toast.info(data.summary.text)

    console.log('Event RX', data)
    PubSub.publish(data.topic, data)
  }

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      if (serverRestartingVisible) {
        setServerRestartingVisible(false)
        // clear ayonApi
        dispatch(ayonApi.util.resetApiState())
      }
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
        readyState,
        serverRestartingVisible,
      }}
    >
      {props.children}
    </SocketContext.Provider>
  )
}
