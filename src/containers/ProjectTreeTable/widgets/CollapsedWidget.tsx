import { forwardRef } from 'react'
import styled from 'styled-components'

const StyledDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ffffff;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

interface CollapsedWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string
}

export const CollapsedWidget = forwardRef<HTMLDivElement, CollapsedWidgetProps>(
  ({ color, ...props }, ref) => {
    return <StyledDot style={{ backgroundColor: color }} {...props} ref={ref}></StyledDot>
  },
)
