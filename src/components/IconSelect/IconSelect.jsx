import React from 'react'
import PropTypes from 'prop-types'
import iconSet from './icons.json'
import { Dropdown } from 'ayon-react-components-test'
import { useMemo } from 'react'
import styled, { css } from 'styled-components'

const IconStyled = styled.div`
  display: flex;
  align-items: center;
  /* justify-content: center; */

  gap: 8px;
  padding-left: 0.5rem;

  height: 30px;

  span:last-child {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* valueTemplate */
  ${({ valueTemplate }) =>
    valueTemplate
      ? css`
          color: var(--color-text);
          border: 1px solid var(--color-grey-03);
          background-color: var(--color-grey-00);

          width: 150px;
        `
      : css`
          width: 100%;
          max-width: 150px;
        `}

  /* isActive */
    ${({ isActive }) =>
    isActive &&
    css`
      background: rgba(100, 181, 246, 0.16);
    `}
`

const IconTemplate = ({ value, valueTemplate, isActive }) => {
  return (
    <IconStyled valueTemplate={valueTemplate} isActive={isActive}>
      <span className={'material-symbols-outlined'}>{value}</span>
      <span>{value}</span>
    </IconStyled>
  )
}

const IconSelect = ({ value, onChange, featured = [] }) => {
  const options = useMemo(() => {
    const options = []

    for (const key in iconSet) {
      options.push({ label: key, value: key })
    }
    return options
  }, [])

  // show featured icons first
  options.sort((a, b) => {
    if (featured.includes(a.value) && !featured.includes(b.value)) return -1
    if (!featured.includes(a.value) && featured.includes(b.value)) return 1
    return 0
  })

  // TODO: remove valueStyle

  return (
    <Dropdown
      value={[value]}
      valueTemplate={() => <IconTemplate value={value} valueTemplate />}
      options={options}
      itemTemplate={({ value }, isActive) => <IconTemplate value={value} isActive={isActive} />}
      onChange={onChange}
      search
      valueStyle={{ width: 150 }}
      style={{ maxWidth: 150 }}
    />
  )
}

IconSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  featured: PropTypes.arrayOf(PropTypes.string),
}

export default IconSelect
