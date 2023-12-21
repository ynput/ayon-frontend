import { useState } from 'react'
import { useInstallAddonsMutation } from '/src/services/addons/updateAddons'
import { useLazyGetMarketAddonVersionQuery } from '/src/services/market/getMarket'
import { toast } from 'react-toastify'

const useInstall = (id, version) => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const [installAddons] = useInstallAddonsMutation()
  const [getAddonVersion] = useLazyGetMarketAddonVersionQuery()

  const installAddon = async () => {
    try {
      setIsLoading(true)
      // first get version to get url
      const { data, error } = await getAddonVersion({ id, version })

      if (error) throw new Error(error.message)

      if (!data?.url) return new Error('No url found')

      await installAddons({ addons: [{ url: data.url }] })

      if (error) throw new Error(error.message)

      setIsLoading(false)
      setError(null)
    } catch (error) {
      console.error(error)

      setIsLoading(false)
      setError(error?.message || 'Error installing addon')

      toast.error(error?.message || 'Error installing addon')
    }
  }

  return {
    installAddon,
    isLoading,
    error,
  }
}

export default useInstall
