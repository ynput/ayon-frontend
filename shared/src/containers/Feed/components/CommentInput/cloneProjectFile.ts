import axios from 'axios'
import { uploadFile } from './helpers'

// download a project file and upload it again, so a copied comment owns its own files
export const cloneProjectFile = async (
  projectName: string,
  id: string,
  name: string,
  mime?: string,
  onProgress?: (e: any, file: File) => void,
) => {
  const { data: blob } = await axios.get<Blob>(`/api/projects/${projectName}/files/${id}`, {
    responseType: 'blob',
  })
  const file = new File([blob], name, { type: mime || blob.type })
  return uploadFile(file, projectName, onProgress)
}
