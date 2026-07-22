import { Icon } from '@ynput/ayon-react-components';
import { forwardRef } from 'react';
import styled from 'styled-components';
import { Body } from './ActivityStatusChange.styled';

const StatusText = styled.span`
      color: var(--md-sys-color-outline);
  white-space: nowrap;
  font-size: 12px;

  strong {
    font-size: 12px;
    font-weight: 800;
  }
`

interface ActivityStatusSecondaryProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: string;
    color?: string;
    name: string;
}

export const ActivityStatusSecondary = forwardRef<HTMLDivElement, ActivityStatusSecondaryProps>(({ 
icon, color, name,
    ...props }, ref) => {
  return (
    <Body {...props} ref={ref}>
            {icon && <Icon icon={icon} style={{ color: color }} />}
            <StatusText>{name}</StatusText>
    </Body>
  );
});