import getSubscribeLink from '@components/TrialBanner/helpers/getSubscribeLink'
import { Button, Toolbar } from '@ynput/ayon-react-components'
import { FC, useEffect } from 'react'
import * as Styled from './TrialEnded.styled'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@state/store'
import { useGetActiveUsersCountQuery } from '@shared/api'
import { useLogoutMutation } from '@queries/auth/logout'
import { useFeedback } from '@shared/components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'

interface TrialEndedProps {
  orgName?: string
}

const TrialEnded: FC<TrialEndedProps> = ({ orgName }) => {
  const user = useAppSelector((state) => state.user)
  const canManage = user.data.isAdmin || user.data.isManager
  const navigate = useNavigate()
  const { openSupport } = useFeedback()

  //   redirect to '/trialend' if not already there
  useEffect(() => {
    if (window.location.pathname !== '/trialend') {
      navigate('/trialend')
    }
  }, [])

  // get the number of users currently active
  const { data: activeUsersCount = 10 } = useGetActiveUsersCountQuery()

  // sign out
  const [logout] = useLogoutMutation()

  return (
    <>
      <DocumentTitle title="Trial end • AYON" />
      <Styled.TrialEndContainer>
      <Toolbar>
        <Styled.Logo src="/AYON.svg" />
        <Button className="logout" variant="text" onClick={() => logout()}>
          Logout
        </Button>
      </Toolbar>
      <Styled.TrialEndCard>
        <h1>Your free trial has ended!</h1>
        {canManage ? (
          <>
            <p>AYON simplifies your VFX pipeline and boosts efficiency.</p>
            <p>Subscribe to keep using AYON and protect your data!</p>
            <Styled.Buttons>
              <Button
                label="Support"
                variant="tonal"
                onClick={() =>
                  openSupport(
                    'NewMessage',
                    'My free trial has ended and I would like to continue using AYON.',
                  )
                }
              />
              <a
                href={orgName ? getSubscribeLink(activeUsersCount, orgName) : ''}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="tertiary">Subscribe now</Button>
              </a>
            </Styled.Buttons>
          </>
        ) : (
          <p>Please ask your administrator to subscribe to AYON.</p>
        )}
      </Styled.TrialEndCard>
    </Styled.TrialEndContainer>
    </>
  )
}

export default TrialEnded
