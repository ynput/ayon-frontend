import ayonClient from '/src/ayon'
import styled from 'styled-components'
import OverflowString from '../components/OverflowString'

const AttributeTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 3px;

  flex: 1;
`

const AttributeTableRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  gap: 8px;
  border-top: 1px solid var(--color-grey-01);
  &:first-child {
    border-top: none !important;
  }
  span:first-child {
    white-space: nowrap;
  }
`

const AttributeTable = ({ entityType, data, additionalData, style, projectAttrib }) => {
  return (
    <AttributeTableContainer style={style}>
      {additionalData &&
        additionalData.map((data, index) => (
          <AttributeTableRow key={index}>
            <span>{data.title}</span>
            <OverflowString>{data.value}</OverflowString>
          </AttributeTableRow>
        ))}

      {data &&
        ayonClient.settings.attributes
          .filter(
            (attr) =>
              attr.scope.includes(entityType) &&
              data[attr.name] !== undefined &&
              data[attr.name] !== null,
          )
          .map((attr) => (
            <AttributeTableRow key={attr.name}>
              <span>{attr.data.title}</span>
              <OverflowString>{data[attr.name]}</OverflowString>
            </AttributeTableRow>
          ))}

      {projectAttrib &&
        projectAttrib.map(({ name, value }) => (
          <AttributeTableRow key={name}>
            <span>{name}</span>
            <OverflowString>{value}</OverflowString>
          </AttributeTableRow>
        ))}
    </AttributeTableContainer>
  )
}

export default AttributeTable
