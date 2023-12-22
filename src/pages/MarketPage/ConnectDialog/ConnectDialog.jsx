import { Dialog } from 'primereact/dialog'
import React from 'react'
import YnputConnector from '/src/components/YnputCloud/YnputConnector'
import * as Styled from './ConnectDialog.styled'
import { Icon } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'

const ConnectDialog = ({ redirect, ...props }) => {
  return (
    <Dialog header="Connect to Ynput Cloud" {...props}>
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
        </Styled.List>
        <YnputConnector smallLogo showLoading skip redirect={redirect} />
      </Styled.Body>
    </Dialog>
  )
}

export default ConnectDialog
