import React from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import YnputConnector from '@components/YnputCloud/YnputConnector'

export const ConnectionDetails = ({ Header, Body, Footer, userForm }) => {
  return (
    <Styled.Section style={{ textAlign: 'center', maxWidth: 472 }}>
      <Header style={{ marginBottom: 16 }}>Connected!</Header>
      <Body>Your Ynput Community account is now linked to the server.</Body>
      <YnputConnector
        initIsOpen={true}
        showDropdown={false}
        styleContainer={{ width: '70%', margin: '8px 0' }}
        style={{ width: '100%' }}
        user={userForm}
        showDisconnect={false}
      />
      <Body>Only admins can see this information and you can disconnect later.</Body>
      <Footer next="Continue" back={null} />
    </Styled.Section>
  )
}

export default ConnectionDetails
