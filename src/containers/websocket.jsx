import { useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import PubSub from 'pubsub-js'


const wsAddress = `${window.location.protocol.replace('http','ws')}//${window.location.host}/ws`


const WebsocketListener = () => {
  console.log("connect to", wsAddress)
  const {sendMessage, readyState, getWebSocket} = useWebSocket(wsAddress, {
      shouldReconnect: () => true,
    }
  )

  useEffect(() => {
    if(readyState === ReadyState.CLOSED){
      console.log("WS CLOSED")
    }

    if(readyState === ReadyState.OPEN){
      sendMessage(JSON.stringify(({
        "topic": "auth",
        "token": localStorage.getItem('accessToken'),
        "subscribe": ["log"]
      })))
      
      getWebSocket().onmessage = (message) =>{

        const data = JSON.parse(message.data)


        console.log("Event RX", data)
        PubSub.publish(data.topic, data);
      }
    }
  }, [readyState, getWebSocket]);

  return (<></>)
}

export default WebsocketListener
