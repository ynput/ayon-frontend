import React from 'react'
import * as Styled from './YnputConnect.styled'
import { Icon, Spacer } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'

const YnputConnectButton = React.forwardRef(
  ({ isConnected, showStatus, showDropdown, isOpen, isLoading, smallLogo, ...props }, ref) => {
    return (
      <Styled.HeaderButton
        {...props}
        ref={ref}
        $disabled={props.disabled || isLoading}
        $isLoading={isLoading}
        $isOpen={isOpen}
      >
        <img
          src="/ynput-connect-logo.svg"
          style={{
            height: smallLogo ? 20 : 29,
          }}
        />
        {(showStatus || showDropdown) && (
          <Styled.Status className="status">
            {showStatus && (
              <>
                <Icon icon={isConnected ? 'check_circle' : isLoading ? 'sync' : 'add'} />
                <span className={Type.labelLarge}>
                  {isConnected ? 'connected' : 'link an account'}
                </span>
              </>
            )}
            <Spacer />
            {showDropdown && isConnected && <Icon icon="expand_more" className="more" />}
          </Styled.Status>
        )}
      </Styled.HeaderButton>
    )
  },
)

YnputConnectButton.displayName = 'YnputConnectButton'

export default YnputConnectButton
