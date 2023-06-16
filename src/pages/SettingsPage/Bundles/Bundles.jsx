import { useState, useMemo } from 'react'
import BundleList from './BundleList'
import BundleDetail from './BundleDetail'

import { Button, Section, Toolbar } from '@ynput/ayon-react-components'

import { useGetBundleListQuery } from '/src/services/bundles'

const Bundles = () => {
  const [selectedBundle, setSelectedBundle] = useState(null)

  const { data: bundleList = [], isLoading } = useGetBundleListQuery()

  const bundleData = useMemo(() => {
    if (!(bundleList && selectedBundle)) return null
    return bundleList.find((bundle) => bundle.name === selectedBundle)
  }, [bundleList, selectedBundle])

  return (
    <main>
      <Section style={{ maxWidth: 600 }}>
        <Toolbar>
          <Button label="New Bundle" icon="add" onClick={() => setSelectedBundle(null)} />
          <Button label="Delete Bundle" icon="delete" />
        </Toolbar>
        <BundleList
          selectedBundle={selectedBundle}
          setSelectedBundle={setSelectedBundle}
          bundleList={bundleList}
          isLoading={isLoading}
        />
      </Section>

      <BundleDetail bundle={bundleData} />
    </main>
  )
}

export default Bundles
