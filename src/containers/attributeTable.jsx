const AttributeTable = ({
  entityType,
  attribSettings,
  data,
  additionalData,
  style,
}) => {
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
        attribSettings
          .filter((attr) => attr.scope.includes(entityType) && data[attr.name])
          .map((attr) => (
            <div key={attr.name} className="attribute-table-row">
              <span>{attr.title}</span>
              <span>{data[attr.name]}</span>
            </div>
          ))}
    </div>
  )
}

export default AttributeTable
