import React from 'react'
import * as Styled from './YnputCloud.styled'
import { Icon, Spacer } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'
import CloudLogo from '@/svg/CloudLogo'

const YnputCloudButton = React.forwardRef(
  (
    { isConnected, showStatus, showDropdown, isOpen, isLoading, smallLogo, darkMode, ...props },
    ref,
  ) => {
    return (
      <Styled.HeaderButton
        {...props}
        ref={ref}
        $disabled={props.disabled || isLoading}
        $isLoading={isLoading}
        $isOpen={isOpen}
        $darkMode={darkMode}
        style={{ borderRadius: 8 }}
      >
        <CloudLogo style={{ height: smallLogo ? 20 : 29 }} darkMode={darkMode} />
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

YnputCloudButton.displayName = 'YnputCloudButton'

export default YnputCloudButton
