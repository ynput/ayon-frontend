import styled from 'styled-components'
import { TableRow } from '@ynput/ayon-react-components'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import copyToClipboard from '../helpers/copyToClipboard'
import { format } from 'date-fns'

const AttributeTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 3px;

  flex: 1;
`

const StyledLoading = styled.div`
  width: 100%;
  height: 40px;
  margin: 4px 0;
  position: relative;

  border-radius: var(--border-radius-m);
  overflow: hidden;
`

const AttributeTable = ({
  entityType,
  data,
  additionalData,
  style,
  projectAttrib,
  extraFields = [],
  isLoading: isLoadingData,
}) => {
  // get attrib fields
  let { data: attribsData = [], isLoadingAttribs } = useGetAttributeListQuery()
  //   filter out scopes
  const attribFields = attribsData.filter(
    (a) => a.scope.some((s) => s === entityType) && a.name in data,
  )

  const isLoading = isLoadingData || isLoadingAttribs

  if (isLoading)
    // add 18 dummy rows
    return (
      <AttributeTableContainer style={style}>
        {[...Array(10)].map((_, index) => (
          <StyledLoading key={index} className="loading" />
        ))}
      </AttributeTableContainer>
    )

  return (
    <AttributeTableContainer style={style}>
      {additionalData &&
        additionalData.map((data, index) => (
          <TableRow key={index} name={data.title} value={data.value} onCopy={copyToClipboard} />
        ))}

      {data &&
        [...extraFields, ...attribFields].map(({ name, data: attribData = {} }) => {
          let value = data[name]

          if (value && name.includes('Date') && !value.includes('Mixed')) {
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
              onCopy={copyToClipboard}
            />
          )
        })}

      {projectAttrib &&
        projectAttrib.map(({ name, value }) => (
          <TableRow key={name} name={name} value={value} onCopy={copyToClipboard} />
        ))}
    </AttributeTableContainer>
  )
}

export default AttributeTable
