const AttributeTable = ({ entityType, attribSettings, data, style }) => {
  return (
    <div
      className="attribute-table"
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
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
