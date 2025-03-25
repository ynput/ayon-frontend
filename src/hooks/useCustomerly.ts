import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { useAppSelector } from '@state/store'
import { useEffect, useRef } from 'react'
import { CustomerlyMessengerPosition, useCustomerly } from 'react-live-chat-customerly'

type UseCustomerlyChat = {
  position?: CustomerlyMessengerPosition
  delay?: number
  enabled?: boolean
  context?: string
}

const useCustomerlyChat = ({ position, delay, enabled, context }: UseCustomerlyChat = {}) => {
  const user = useAppSelector((state) => state.user)
  const userLevel = user.data.isAdmin ? 'admin' : user.data.isManager ? 'manager' : 'user'
  // get subscriptions info
  const { data: connect } = useGetYnputCloudInfoQuery()
  const ayonSubscription = connect?.subscriptions?.find((s) => s.productType === 'ayon')

  const { load, ...rest } = useCustomerly()
  const loaded = useRef(false)

  useEffect(() => {
    // only load if
    // - user is loaded
    // - chat is enabled
    // - chat is not already loaded
    if (!user || !enabled || loaded.current) return

    const orgName = connect?.orgName
    const userId = `${orgName}-${user.name}`

    load({
      visible: !delay,
      position,
      direction: 'left',
      user_id: userId,
      email: user.attrib.email ?? undefined,
      name: user.attrib.fullName ?? user.name,
      company: {
        company_id: connect?.orgId || 'none',
        name: orgName,
        // @ts-ignore
        trialEnd: ayonSubscription?.trialEnd,
      },
      attributes: {
        visitedInstance: true,
        userLevel: userLevel,
        context,
      },
    })
    loaded.current = true
  }, [connect, ayonSubscription, user, loaded, load, enabled, context])

  //   once the chat is loaded, we can open it after the delay
  useEffect(() => {
    if (!Number.isNaN(delay) && loaded.current && enabled) {
      const timer = setTimeout(() => {
        rest.show()
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [delay, rest, loaded.current, enabled])

  return { ...rest }
}

export default useCustomerlyChat
