import { useState } from 'react'
import { useDownloadAddonsMutation } from '@queries/addons/updateAddons'
import { useLazyMarketAddonVersionDetailQuery } from '@queries/market/getMarket'
import { toast } from 'react-toastify'

const useDownload = (onDownload) => {
  const [error, setError] = useState(null)

  const [downloadAddons] = useDownloadAddonsMutation()
  const [getAddonVersion] = useLazyMarketAddonVersionDetailQuery()

  const downloadAddon = async (name, version) => {
    try {
      if (!version) return new Error('No version found')
      if (!name) return new Error('No name found')

      // first get version to get url
      const { data, error } = await getAddonVersion({ addonName: name, addonVersion: version })

      if (error) throw new Error(error.message)

      if (!data?.url) throw new Error('No download candidate found')

      await downloadAddons({
        addons: [{ url: data.url, name, version }],
      }).unwrap()

      onDownload(name)
    } catch (error) {
      console.error(error)

      setError(error?.message || 'Error downloading addon')

      toast.error(error?.message || 'Error downloading addon')
    }
  }

  return {
    downloadAddon,
    error,
  }
}

export default useDownload
