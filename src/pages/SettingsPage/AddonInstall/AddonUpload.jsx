import { useEffect, useState } from 'react'
import { Button, FileUpload, SaveButton } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import api from '@api'
import { useDispatch, useSelector } from 'react-redux'
import {
  useCreateInstallerMutation,
  useUploadInstallersMutation,
} from '@queries/installers/updateInstallers'
import {
  useUploadDependencyPackagesMutation,
  useCreateDependencyPackageMutation,
} from '@queries/dependencyPackages/updateDependencyPackages'
import { onUploadFinished, onUploadProgress } from '@state/context'
import axios from 'axios'
import AddonManager from './AddonManager'

const StyledFooter = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-start;
  gap: var(--base-gap-large);

  div {
    display: flex;
    width: 100%;
    gap: var(--base-gap-small);

    & > * {
      flex: 1;
    }
  }
`

const StyledProgressBar = styled.hr`
  height: 4px;
  border-radius: 2px;
  background-color: var(--md-sys-color-primary-container);

  width: ${({ $progress }) => $progress}%;
  border: none;
  margin: 4px 0;

  transition: width 0.3s;
`

const AddonUpload = ({
  onClose,
  type = 'addon',
  onInstall,
  dropOnly,
  abortController,
  onUploadStateChange,
  manager,
  manageMode,
  setManageMode,
  ...props
}) => {
  const dispatch = useDispatch()
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const progress = useSelector((state) => state.context.uploadProgress)

  // Wrapping state callback to sync the parent uploading state
  const toggleIsUploading = (value) => {
    setIsUploading(value)
    onUploadStateChange(value)
  }

  // installers
  const [createInstaller] = useCreateInstallerMutation()
  const [uploadInstallers] = useUploadInstallersMutation()
  // upload packages
  const [createPackage] = useCreateDependencyPackageMutation()
  const [uploadPackages] = useUploadDependencyPackagesMutation()

  const typeLabel =
    type === 'package' ? 'Dependency Package' : type === 'addon' ? 'Addon' : 'Installer'

  // first create the installer using the .json file
  const handleCreateInstaller = async (files) => {
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
        if (type === 'package') await createPackage({ dependencyPackage: data }).unwrap()
        if (type === 'installer') {
          console.log('creating installer', data)
          await createInstaller({ installer: data }).unwrap()
          dispatch(
            api.util.updateQueryData('listInstallers', {}, (draft) => {
              draft.installers.push(data)
            }),
          )
        }
      }

      console.log('finished: created ' + type)
      return true
    } catch (error) {
      toggleIsUploading(false)
      setErrorMessage(error?.data?.detail)
      console.error(error)
      return false
    }
  }

  // then upload the .exe file
  const handleUploadInstaller = async (files) => {
    const filesToUpload = files.map(({ file }) => ({ data: file }))
    console.log('progress: uploading ' + type, filesToUpload)
    try {
      let success, res
      if (type === 'installer') {
        res = await uploadInstallers({
          files: filesToUpload,
          isNameEndpoint: true,
          abortController,
        }).unwrap()
        success = true
      } else if (type === 'package') {
        res = await uploadPackages({
          files: filesToUpload,
          isNameEndpoint: true,
          abortController,
        }).unwrap()
        success = true
      } else success = false

      if (res.some((r) => r?.error)) {
        // filter and reduce down to an object with the error message
        const error = res.filter((r) => r?.error)[0].error
        throw error
      }

      console.log('finished: uploaded ' + type)
      return success
    } catch (error) {
      console.error(error?.detail || error)
      setErrorMessage(error?.detail || error)
      return false
    }
  }

  const handleInstallerPackage = async () => {
    const jsonFiles = files.filter((file) => file.file.name?.endsWith('.json'))
    const installerFiles = files.filter((file) => !file.file.name?.endsWith('.json'))
    // first check that there are two files, one .exe and one .json
    if (!jsonFiles.length && !installerFiles.length) {
      console.log('wrong file types')
      setErrorMessage(`Please upload at least one installer or .json file`)
      return
    }

    // start loading
    toggleIsUploading(true)
    setIsComplete(false)
    setErrorMessage(null)

    const onError = () => {
      toggleIsUploading(false)
      setIsComplete(true)
    }

    if (jsonFiles.length) {
      // first create the installers
      const createRes = await handleCreateInstaller(jsonFiles)
      // exit if there was an error
      if (!createRes) {
        onError()
        return
      }
    }

    if (installerFiles.length) {
      const uploadRes = await handleUploadInstaller(installerFiles)
      // exit if there was an error
      if (!uploadRes) {
        onError()
        return
      }
    }

    // const both = jsonFiles.length && installerFiles.length

    // let message = ''
    // if (both) {
    //   message = type + 's created and uploaded'
    // } else if (jsonFiles.length) {
    //   message = type + 's created'
    // } else if (installerFiles.length) {
    //   message = type + 's uploaded'
    // }

    toggleIsUploading(false)
    setIsComplete(true)

    setFiles([])

    onInstall(type)
  }

  const cancelToken = axios.CancelToken
  const cancelTokenSource = cancelToken.source()

  const handleAddonInstall = async () => {
    let index = 0
    toggleIsUploading(true)
    try {
      for (const file of files) {
        const opts = {
          signal: abortController.signal,
          cancelToken: cancelTokenSource.token,
          onUploadProgress: (e) =>
            dispatch(
              onUploadProgress({
                progress: { loaded: e.loaded, total: e.total },
                index: index + 1,
                filesTotal: files.length,
              }),
            ),
        }

        await axios.post('/api/addons/install', file.file, opts)
        index++
      }
      toggleIsUploading(false)
      setIsComplete(true)

      setFiles([])
      onInstall(type)

      // update addon list
      dispatch(api.util.invalidateTags(['bundleList', 'addonList']))
    } catch (error) {
      console.log(error)
      toggleIsUploading(false)
      setIsComplete(true)
      dispatch(onUploadFinished())
      setErrorMessage('ERROR: ' + error?.response?.data?.detail)
    }
  }

  const handleSubmit = () => {
    if (type === 'addon') return handleAddonInstall()
    else return handleInstallerPackage()
  }

  // when dropOnly, auto upload when files has length
  useEffect(() => {
    if (files.length && dropOnly) handleSubmit()
  }, [files])

  let message = ''
  // complete message
  if (isComplete && !isUploading) {
    if (errorMessage) {
      message = <span style={{ color: 'var(--color-hl-error)' }}>{errorMessage}</span>
    } else {
      message = 'Upload complete!'
    }
  } else {
    if (type === 'addon') {
      message = 'Supports multiple .zip files.'
    } else {
      message = `Supports multiple .json and ${typeLabel}  files.`
    }
  }
  // default message

  if (manager && manageMode) {
    return <AddonManager manager={manager} manageMode={manageMode} setManageMode={setManageMode} />
  }
  return (
    <FileUpload
      files={files}
      setFiles={setFiles}
      title={null}
      accept={type === 'addon' ? ['.zip'] : ['*']}
      allowMultiple
      placeholder={`Drop ${typeLabel} files`}
      isSuccess={isComplete}
      extraHeaderActions={
        !!manager && <Button onClick={() => setManageMode(true)} label="Manage uploads" />
      }
      footer={
        !dropOnly && (
          <StyledFooter style={{ display: 'flex', width: '100%' }}>
            {message}
            {isUploading && <StyledProgressBar $progress={progress} />}
            <div>
              {onClose && <Button onClick={onClose} label={isComplete ? 'Close' : 'Cancel'} />}
              <SaveButton
                disabled={isUploading}
                active={files.length}
                label="Upload"
                onClick={handleSubmit}
                saving={isUploading}
              />
            </div>
          </StyledFooter>
        )
      }
      {...props}
    />
  )
}

export default AddonUpload
