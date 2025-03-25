import axios from 'axios'
import { onUploadFinished, onUploadProgress } from '@state/context'

const queryUpload = async (arg, api, { endpoint, method = 'put', overwrite = false }) => {
  // isNameEndpoint is used to determine if the endpoint has the name of the file in the url
  const { files, isNameEndpoint, abortController } = arg
  const { dispatch } = api

  const cancelToken = axios.CancelToken
  const cancelTokenSource = cancelToken.source()

  const results = []

  let index = 0
  for (const file of files) {
    try {
      const opts = {
        signal: abortController?.signal,
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

      let fullEndpoint = endpoint

      if (isNameEndpoint && !file.url) {
        // file is actually a name
        fullEndpoint += `/${file.data.name}`
      }

      if (file.url) {
        // file is actually a url
        fullEndpoint += `?url=${file.url}`
      }

      if (file.name) {
        fullEndpoint += `&addonName=${file.name}`
      }

      if (file.version) {
        fullEndpoint += `&addonVersion=${file.version}`
      }

      if (overwrite) {
        if (file.url) {
          fullEndpoint += `&overwrite=true`
        } else {
          fullEndpoint += `?overwrite=true`
        }
      }

      const axiosMethod = method === 'put' ? axios.put : axios.post

      const res = await axiosMethod(fullEndpoint, file.data, opts)
      index++

      if (res.data) {
        results.push({ eventId: res.data.eventId, file })
      }
    } catch (error) {
      console.error(error)
      results.push({
        eventId: null,
        file,
        error:
          { detail: error?.response?.data?.detail, status: error?.response?.status } ||
          'Upload error',
      })
    }
  }

  // reset loading progress
  dispatch(onUploadFinished())

  return { data: results }
}

export default queryUpload
