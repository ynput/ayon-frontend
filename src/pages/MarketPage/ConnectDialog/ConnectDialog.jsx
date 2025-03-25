import React from 'react'
import YnputConnector from '@components/YnputCloud/YnputConnector'
import * as Styled from './ConnectDialog.styled'
import { Icon, Dialog } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'

const ConnectDialog = ({ redirect, visible, onHide, ...props }) => {
  return (
    <Dialog
      header="Connect to Ynput Cloud"
      size="lg"
      style={{ width: 400 }}
      isOpen={visible}
      onClose={onHide}
      {...props}
    >
      <Styled.Body>
        <Styled.List>
          <Styled.ListItem>
            <Icon icon="check_circle" />
            <span className={Type.titleMedium}>Addon Market Access</span>
          </Styled.ListItem>
          <Styled.ListItem>
            <Icon icon="check_circle" />
            <span className={Type.titleMedium}>Official Release Bundles</span>
          </Styled.ListItem>
          <Styled.ListItem>
            <Icon icon="check_circle" />
            <span className={Type.titleMedium}>Automated Bootstrapping</span>
          </Styled.ListItem>
          <YnputConnector smallLogo showLoading skip redirect={redirect} />
        </Styled.List>
      </Styled.Body>
    </Dialog>
  )
}

export default ConnectDialog
