import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import UserImage from '/src/pages/settings/users/UserImage'

const RowStyled = styled.span`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;

  ${({ isSelected }) =>
    isSelected &&
    css`
      background-color: var(--color-row-hl);
    `}
`

const AssigneeDropdown = ({ name, avatarUrl, fullName, isSelected, onClick }) => {
  return (
    <RowStyled {...{ isSelected, onClick }}>
      <UserImage src={avatarUrl} fullName={fullName || name} size={21} />
      {fullName || name}
    </RowStyled>
  )
}

AssigneeDropdown.propTypes = {
  name: PropTypes.string.isRequired,
  fullName: PropTypes.string,
  avatarUrl: PropTypes.string,
  isSelected: PropTypes.bool,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
}

export default AssigneeDropdown
