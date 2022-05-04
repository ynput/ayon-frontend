const AttributeTable = ({ entityType, attribSettings, data, style}) => {
  return (
    <div 
      className="attribute-table"
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      <h4 style={{ marginTop: 10 }}>Attributes</h4>
      {data && attribSettings
        .filter((attr) =>
          attr.scope.includes(entityType) && data[attr.name]
          )
        .map((attr) => (
            <div 
              className="attribute-table-row"
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: "3px 0",
                borderTop: '1px dotted rgba(0,0,0,0.6)',
              }}
            >
              <span>{attr.title}</span><span>{data[attr.name]}</span>
            </div>
        ))}
    </div>
  )
}

export default AttributeTable
