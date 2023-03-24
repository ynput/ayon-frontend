import { format } from 'date-fns'
import styled from 'styled-components'
import TableRow from '../components/TableRow'
import { useGetAttributesQuery } from '../services/getAttributes'

const AttributeTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 3px;

  flex: 1;
`

const AttributeTable = ({
  entityType,
  data,
  additionalData,
  style,
  projectAttrib,
  extraFields = [],
}) => {
  // get attrib fields
  let { data: attribsData = [], isLoading } = useGetAttributesQuery()
  //   filter out scopes
  const attribFields = attribsData.filter(
    (a) => a.scope.some((s) => s === entityType) && a.name in data,
  )

  if (isLoading) return null

  return (
    <AttributeTableContainer style={style}>
      {additionalData &&
        additionalData.map((data, index) => (
          <TableRow key={index} name={data.title} value={data.value} />
        ))}

      {data &&
        [...extraFields, ...attribFields].map(({ name, data: attribData = {} }) => {
          let value = data[name]

          if (value && name.includes('Date')) {
            value = format(new Date(value), 'dd/MM/yyyy')
          }

          // if value is an array
          if (Array.isArray(value)) {
            value = value.join(', ')
          }

          // if value is an object
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value)
          }

          if (!attribData) return null

          return (
            <TableRow
              key={name}
              value={value}
              name={attribData.title}
              tooltip={attribData.description}
            />
          )
        })}

      {projectAttrib &&
        projectAttrib.map(({ name, value }) => <TableRow key={name} name={name} value={value} />)}
    </AttributeTableContainer>
  )
}

export default AttributeTable
