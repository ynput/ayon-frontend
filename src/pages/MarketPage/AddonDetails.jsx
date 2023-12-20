import React from 'react'

const AddonDetails = ({ addon = {} }) => {
  const { name, description } = addon

  return (
    <div style={{ width: 200 }}>
      {name && (
        <>
          <h2>{name}</h2>
          <p>{description}</p>
        </>
      )}
    </div>
  )
}

export default AddonDetails
