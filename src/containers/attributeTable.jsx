import pypeClient from '/src/pype'

const AttributeTable = ({ entityType, data, additionalData, style }) => {
  return (
    <div
      className="attribute-table"
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {additionalData &&
        additionalData.map((data, index) => (
          <div key={index} className="attribute-table-row">
            <span>{data.title}</span>
            <span>{data.value}</span>
          </div>
        ))}

      {data &&
        pypeClient.settings.attributes
          .filter((attr) => attr.scope.includes(entityType) && data[attr.name])
          .map((attr) => (
            <div key={attr.name} className="attribute-table-row">
              <span>{attr.data.title}</span>
              <span>{data[attr.name]}</span>
            </div>
          ))}
    </div>
  )
}

export default AttributeTable
