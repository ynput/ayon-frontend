import React from 'react'
import * as Styled from './Actions.styled'
import { Button } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'


import {useState, useEffect} from 'react'
import axios from 'axios'


const Actions = ({ entities }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [bundleVariant, setBundleVariant] = useState(null)
  const [options, setOptions] = useState([])
  
  console.log("Entities for actions", entities)


  useEffect(() => {
    if (!entities.length || !entities[0].projectName || !entities[0].entityType){
      setOptions([])
      return
    }

    setIsLoading(true)

    const payload = {
      projectName: entities[0].projectName,
      entityType: entities[0].entityType,
      entityIds: entities.map((entity) => entity.id),
    }
      

    axios
      .post('/api/actions/list', payload)
      .then((response) => {
        setOptions(response.data.actions)
        setBundleVariant(response.data.bundleVariant)
      })
      .finally(() => {
        setIsLoading(false)
      })


  }, [entities])


  const onExecuteAction = (identifier) => {
    const action = options.find((option) => option.identifier === identifier)
    console.log("Executing action", action)
  }



  return (
    <Styled.Actions className={classNames('actions', { isLoading })}>
      {options.map((option) => (
        <Styled.PinnedAction key={option.identifier}>
          <img 
            src={`/logos/${option.icon}.png`} 
            title={option.label}
            onClick={() => onExecuteAction(option.identifier)} 
          />
        </Styled.PinnedAction>
      ))}

      <Styled.More options={options} placeholder="" value={[]} />
    </Styled.Actions>
  )


}

export default Actions
