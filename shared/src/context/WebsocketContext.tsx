import { useEffect, useState, createContext, useCallback, useRef, useContext } from 'react'
import { toast } from 'react-toastify'
import { PubSub } from '@shared/util'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { debounce, isEqual } from 'lodash'
import api from '@shared/api'
import { RefreshToast } from '@shared/components'
import { useLazyGetSiteInfoQuery } from '@shared/api'
import { WebSocketLike } from 'react-use-websocket/dist/lib/types'

export type WebsocketContextType = {
  getWebSocket: () => WebSocketLike | null
  readyState: ReadyState
  serverRestartingVisible: boolean
}

export const SocketContext = createContext<WebsocketContextType | undefined>(undefined)

const proto = window.location.protocol.replace('http', 'ws')
const wsAddress = `${proto}//${window.location.host}/ws`

// define global window senderId type
declare global {
  interface Window {
    senderId: string
  }
}

export type SocketProviderProps = {
  children: React.ReactNode
  userName?: string
  projectName?: string
  dispatch: any
}

export const SocketProvider = ({
  children,
  userName,
  projectName,
  dispatch,
}: SocketProviderProps) => {
  // get user logged in
  const [serverRestartingVisible, setServerRestartingVisible] = useState(false)
  const [topics, setTopics] = useState([])
  const [getInfo] = useLazyGetSiteInfoQuery()

  const wsOpts = {
    shouldReconnect: () => {
      if (!userName) return false
      // check if there is a token
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) return false

      // test if the token is valid
      // if it's not then this will automatically log out the user
      getInfo({ full: false }).unwrap()

      return true
    },
  }

  const { sendMessage, readyState, getWebSocket } = useWebSocket(wsAddress, wsOpts)

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
    console.debug('Topics changed', topics)
    subscribe()
  }, [topics, projectName])

  const updateTopicsDebounce = debounce((newTopics) => {
    if (isEqual(topics, newTopics)) return
    console.log('WS: Subscriptions changed')
    setTopics(newTopics)
  }, 200)

  PubSub.setOnSubscriptionsChange((newTopics: string[]) => updateTopicsDebounce(newTopics))

  const [overloaded, setOverloaded] = useState(false)
  const [toastShown, setToastShown] = useState(false)

  // when overloaded is true, activate toast
  useEffect(() => {
    if (overloaded)
      if (!toastShown) {
        toast.warning(<RefreshToast />, {
          autoClose: false,
          closeButton: false,
        })
        setToastShown(true)
      }

    return () => {
      setOverloaded(false)
    }
  }, [overloaded, setOverloaded])

  // onMessage is a function that is called when a message comes in from the websocket
  // it is a closure that keeps track of the number of calls and the last call time
  // Using useRef to persist the closure state across renders
  const messageStatsRef = useRef({ callCount: 0, lastCall: Date.now() })

  const onMessage = useCallback(
    (message: any) => {
      // If the function is called more than 100 times per second, return early.
      const threshold = 1000
      if (messageStatsRef.current.callCount > threshold) {
        setOverloaded(true)
        return console.log(
          `Overload: Over ${threshold} messages per second. Ignoring subsequent messages.`,
        )
      }

      let data
      try {
        data = JSON.parse(message.data)
      } catch (error) {
        console.error('Failed to parse websocket message:', error, message.data)
        return
      }

      const { topic, sender, summary } = data || {}
      if (topic === 'heartbeat') return

      if (topic === 'server.restart_requested') setServerRestartingVisible(true)

      if (sender === window.senderId) {
        return // my own message. ignore
      }

      const now = Date.now()
      if (now - messageStatsRef.current.lastCall < 1000) {
        messageStatsRef.current.callCount += 1
      } else {
        messageStatsRef.current.callCount = 0
      }

      messageStatsRef.current.lastCall = now

      if (topic === 'shout' && data?.summary?.text) toast.info(summary.text)

      console.log('Event RX', data)
      PubSub.publish(topic, data)
    },
    [setServerRestartingVisible],
  )

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      if (serverRestartingVisible) {
        setServerRestartingVisible(false)
        // clear ayonApi
        dispatch(api.util.resetApiState())
      }
      // @ts-ignore
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
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}
