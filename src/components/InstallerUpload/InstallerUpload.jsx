import { FileUpload } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import { useCreateInstallerMutation } from '/src/services/installers'
import axios from 'axios'

const InstallerUpload = ({ type = 'installer' }) => {
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [message, setMessage] = useState(null)

  const [createInstaller] = useCreateInstallerMutation()
  let endPoint = 'installers'
  if (type === 'package') endPoint = 'dependency_packages'

  const accepts = ['.json']
  const fileType = type === 'installer' ? '.exe' : '.zip'
  accepts.push(fileType)

  // first create the installer using the .json file
  const handleCreateInstaller = async (files) => {
    setMessage('Creating ' + type)
    console.log('progress: creating ' + type, files)
    try {
      // now extract the .json data as an object for each file
      for (const { file: jsonFile } of files) {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsText(jsonFile)
          reader.onload = () => {
            try {
              const data = JSON.parse(reader.result)
              resolve(data)
            } catch (error) {
              reject(error)
            }
          }
          reader.onerror = () => {
            reject(reader.error)
          }
        })
        // Use the data object here
        // create installer with json data
        await createInstaller({ data, endPoint }).unwrap()
      }

      console.log('finished: created ' + type)
      return true
    } catch (error) {
      setError(error?.data?.detail)
      console.error(error)
      return false
    }
  }

  // then upload the the .exe file
  const handleUploadInstaller = async (files) => {
    const opts = {
      signal: new AbortController().signal,
      cancelToken: axios.CancelToken.source().token,
    }
    setMessage('Uploading ' + type)
    console.log('progress: uploading ' + type, files)
    try {
      for (const { file: exe } of files) {
        const filename = exe.name
        await axios.put(`/api/desktop/${endPoint}/` + filename, exe, opts)
      }
    } catch (error) {
      console.error(error)
      setError('Error uploading' + type)
      return false
    }

    console.log('finished: uploaded ' + type)
    return true
  }

  const handleSubmit = async (files) => {
    const jsonFiles = files.filter((file) => file.file.name?.endsWith('.json'))
    const exeFiles = files.filter((file) => file.file.name?.endsWith(fileType))
    // first check that there are two files, one .exe and one .json
    if (!jsonFiles.length && !exeFiles.length) {
      console.log('wrong file types')
      setError(`Please upload at least one ${fileType} or .json file`)
      return
    }

    // start loading
    setIsLoading(true)
    setIsSuccess(false)
    setError(null)

    if (jsonFiles.length) {
      // first create the installers
      const createRes = await handleCreateInstaller(jsonFiles)
      // exit if there was an error
      if (!createRes) {
        setIsLoading(false)
        return
      }
    }

    if (exeFiles.length) {
      const uploadRes = await handleUploadInstaller(exeFiles)
      // exit if there was an error
      if (!uploadRes) {
        setIsLoading(false)
        return
      }
    }

    const both = jsonFiles.length && exeFiles.length

    let message = ''
    if (both) {
      message = type + 's created and uploaded'
    } else if (jsonFiles.length) {
      message = type + 's created'
    } else if (exeFiles.length) {
      message = type + 's uploaded'
    }

    setMessage(message)
    setIsSuccess(true)
    setIsLoading(false)
    setFiles([])
  }

  return (
    <FileUpload
      files={files}
      setFiles={setFiles}
      allowMultiple
      accept={accepts}
      onSubmit={handleSubmit}
      placeholder="Drop .exe and .json files here"
      isError={!!error}
      errorMessage={error}
      confirmLabel={`Upload ${type}`}
      successMessage={message}
      message={message}
      isLoading={isLoading}
      isSuccess={isSuccess}
    />
  )
}

export default InstallerUpload
