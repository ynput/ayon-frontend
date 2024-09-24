import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { useAppSelector } from '@state/store'
import { useEffect, useRef } from 'react'
import { CustomerlyMessengerPosition, useCustomerly } from 'react-live-chat-customerly'

type UseCustomerlyChat = {
  position?: CustomerlyMessengerPosition
  delay?: number
  disabled?: boolean
}

const useCustomerlyChat = ({ position, delay, disabled }: UseCustomerlyChat = {}) => {
  const user = useAppSelector((state) => state.user)
  const userLevel = user.data.isAdmin ? 'admin' : user.data.isManager ? 'manager' : 'user'
  // get subscriptions info
  const { data: connect } = useGetYnputCloudInfoQuery()
  const ayonSubscription = connect?.subscriptions?.find((s) => s.productType === 'ayon')

  const { load, ...rest } = useCustomerly()
  const loaded = useRef(false)

  useEffect(() => {
    if (!connect || !ayonSubscription || !user) return

    const orgName = connect.orgName
    const userId = `${orgName}-${user.name}`

    if (!loaded.current && !disabled) {
      load({
        visible: !delay && !disabled,
        position,
        user_id: userId,
        email: user.attrib.email ?? undefined,
        name: user.attrib.fullName ?? user.name,
        company: {
          company_id: connect.orgId,
          name: orgName,
        },
        attributes: {
          trialing: true,
          instanceId: connect.instanceId,
          trialEnd: ayonSubscription.trialEnd,
          userLevel: userLevel,
        },
      })
      loaded.current = true
    }
  }, [connect, ayonSubscription, user, loaded, load, disabled])

  //   once the chat is loaded, we can open it after the delay
  useEffect(() => {
    if (!Number.isNaN(delay) && loaded.current) {
      const timer = setTimeout(() => {
        rest.show()
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [delay, rest, loaded.current])

  return { ...rest }
}

export default useCustomerlyChat
