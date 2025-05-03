import getSubscribeLink from '@components/TrialBanner/helpers/getSubscribeLink'
import { Button, Toolbar } from '@ynput/ayon-react-components'
import { FC, useEffect } from 'react'
import * as Styled from './TrialEnded.styled'
import useCustomerlyChat from '@hooks/useCustomerly'
import { useNavigate } from 'react-router'
import { useAppSelector } from '@state/store'
import { useGetActiveUsersCountQuery } from '@shared/api'
import { useLogOutMutation } from '@queries/auth/logout'

interface TrialEndedProps {
  orgName: string
}

const TrialEnded: FC<TrialEndedProps> = ({ orgName }) => {
  const user = useAppSelector((state) => state.user)
  const canManage = user.data.isAdmin || user.data.isManager
  const navigate = useNavigate()
  const { open } = useCustomerlyChat({ enabled: canManage })

  //   redirect to '/trialend' if not already there
  useEffect(() => {
    if (window.location.pathname !== '/trialend') {
      navigate('/trialend')
    }
  }, [])

  // get the number of users currently active
  const { data: activeUsersCount = 10 } = useGetActiveUsersCountQuery()

  // sign out
  const [logout] = useLogOutMutation()

  return (
    <Styled.TrialEndContainer>
      <Toolbar>
        <Styled.Logo src="/AYON.svg" />
        <Button className="logout" variant="text" onClick={logout}>
          Logout
        </Button>
      </Toolbar>
      <Styled.TrialEndCard>
        <h1>Your free trial has ended!</h1>
        {canManage ? (
          <>
            <p>
              AYON simplifies your VFX pipeline and boosts efficiency. Need help? Our{' '}
              <u onClick={open}>support team</u> is here for you if required.
            </p>
            <p>Subscribe to keep using AYON and protect your data!</p>
            <a href={getSubscribeLink(activeUsersCount, orgName)} target="_blank" rel="noreferrer">
              <Button variant="tertiary">Subscribe now</Button>
            </a>
          </>
        ) : (
          <p>Please ask your administrator to subscribe to AYON.</p>
        )}
      </Styled.TrialEndCard>
    </Styled.TrialEndContainer>
  )
}

export default TrialEnded
