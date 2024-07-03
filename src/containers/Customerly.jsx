import { useGetYnputConnectionsQuery } from '@/services/ynputConnect'
import { Button } from '@ynput/ayon-react-components'
import { useEffect, useRef } from 'react'
import { useCustomerly } from 'react-live-chat-customerly'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

const SupportButton = styled(Button)`
  position: fixed;
  bottom: 8px;
  left: 8px;
  z-index: 1000;
`

const Customerly = () => {
  const user = useSelector((state) => state.user)

  const { data: connectData, isLoading: isLoadingCloud } = useGetYnputConnectionsQuery(
    {},
    { skip: !user.name },
  )

  const { load, open } = useCustomerly()
  const loaded = useRef(false)

  // load chat when connection to cloud is made
  useEffect(() => {
    if (isLoadingCloud || !connectData || !user) return

    const orgName = connectData?.orgName
    const userId = orgName + '-' + user.name
    console.log(connectData)

    if (!loaded.current) {
      console.log('loading customerly...')
      load({
        user_id: userId,
        email: user.attrib.email ?? undefined,
        name: user.attrib.fullName ?? user.name,
        company: {
          company_id: connectData.orgId,
          name: orgName,
        },
      })
      loaded.current = true
    }
  }, [isLoadingCloud, connectData, user, loaded])

  // Button to open the chat interface
  const handleOpenChat = () => {
    open()
  }

  return <SupportButton onClick={handleOpenChat}>HELP!</SupportButton>
}

export default Customerly
