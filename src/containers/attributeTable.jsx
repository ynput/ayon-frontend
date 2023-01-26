import ayonClient from '/src/ayon'
import styled from 'styled-components'

const AttributeTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 3px;

  overflow: auto;
  flex: 1;
`

const AttributeTableRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  border-top: 1px solid var(--color-grey-01);
  &:first-child {
    border-top: none !important;
  }
`

const AttributeTable = ({ entityType, data, additionalData, style }) => {
  return (
    <AttributeTableContainer style={style}>
      {additionalData &&
        additionalData.map((data, index) => (
          <AttributeTableRow key={index}>
            <span>{data.title}</span>
            {data.value}
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
              {data[attr.name]}
            </AttributeTableRow>
          ))}
    </AttributeTableContainer>
  )
}

export default AttributeTable
