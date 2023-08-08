import axios from 'axios'
import { onUploadFinished, onUploadProgress } from '../features/context'

const queryUpload = async (arg, api, { endpoint, method = 'put' }) => {
  // isNameEndpoint is used to determine if the endpoint has the name of the file in the url
  const { files, isNameEndpoint } = arg
  const { dispatch } = api
  try {
    const abortController = new AbortController()
    const cancelToken = axios.CancelToken
    const cancelTokenSource = cancelToken.source()

    const results = []

    let index = 0
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

      const fullEndpoint = isNameEndpoint ? `${endpoint}/${file.name}` : endpoint

      const axiosMethod = method === 'put' ? axios.put : axios.post

      const res = await axiosMethod(fullEndpoint, file, opts)
      index++

      if (res.data) {
        results.push(res.data.eventId)
      }
    }

    // reset loading progress
    dispatch(onUploadFinished())

    return { data: results }
  } catch (error) {
    console.error(error)
    // reset loading progress
    dispatch(onUploadFinished())
    return { error: error?.response?.data?.detail || 'Upload error' }
  }
}

export default queryUpload
