import React from 'react'
import * as Styled from './Actions.styled'
import { Button } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'
import { toast } from 'react-toastify'

import {useState, useEffect, useMemo} from 'react'
import axios from 'axios'


const Actions = ({ entities }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [bundleVariant, setBundleVariant] = useState("production")
  const [options, setOptions] = useState([])
  
  const context = useMemo(() => {
    if (!entities.length) return null
    if (!entities[0].projectName) return null
    if (!entities[0].entityType) return null

    // get a list of unique entity subtypes
    const entitySubtypes = entities.map((entity) => entity.entitySubType)
      .filter((value, index, self) => self.indexOf(value) === index)

    return {
      projectName: entities[0].projectName,
      entityType: entities[0].entityType,
      entityIds: entities.map((entity) => entity.id),
      entitySubtypes,
    }
  }, [entities])


  useEffect(() => {
    if (!context) {
      setIsLoading(false)
      setOptions([])
      return
    }
    setIsLoading(true)
      
    axios
      .post('/api/actions/list', context)
      .then((response) => {
        setOptions(response.data.actions)
        setBundleVariant(response.data.bundleVariant)
      })
      .catch((error) => {
        console.warn("Error fetching actions", error)
        setOptions([])
      })
      .finally(() => {
        setIsLoading(false)
      })

  }, [context])


  const onExecuteAction = (identifier) => {
    const action = options.find((option) => option.identifier === identifier)
    console.log("Executing action", action)

    const params = {
      addonName: action.addonName,
      addonVersion: action.addonVersion,
      variant: bundleVariant,
      identifier: action.identifier,
    }

    axios
      .post( '/api/actions/execute', context, { params })
      .then((response) => {
        console.log("Action executed", response)
        toast.success(response?.data?.message || "Action executed successfully")
        if (response?.data?.uri) {
          window.location.href = response.data.uri
        }
      })
      .catch((error) => {
        console.warn("Error executing action", error)
        toast.error(error?.response?.data?.message || "Error executing action")
      
      })

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
