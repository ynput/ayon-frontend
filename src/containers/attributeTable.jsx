import ayonClient from '/src/ayon'
import styled from 'styled-components'
import TableRow from '../components/TableRow'

const AttributeTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 3px;

  flex: 1;

  ${({ isLoading }) => isLoading && 'opacity: 0.25;'}
`

const AttributeTable = ({ entityType, data, additionalData, style, projectAttrib, isLoading }) => {
  return (
    <AttributeTableContainer style={style} isLoading={isLoading}>
      {additionalData &&
        additionalData.map((data, index) => (
          <TableRow key={index} name={data.title} value={data.value} />
        ))}

      {data &&
        ayonClient.settings.attributes
          .filter(
            (attr) =>
              attr.scope.includes(entityType) &&
              data[attr.name] !== undefined &&
              data[attr.name] !== null,
          )
          .map((attr) => <TableRow key={attr.name} value={data[attr.name]} name={attr.name} />)}

      {projectAttrib &&
        projectAttrib.map(({ name, value }) => <TableRow key={name} name={name} value={value} />)}
    </AttributeTableContainer>
  )
}

export default AttributeTable
