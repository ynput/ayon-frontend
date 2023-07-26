import { FormLayout } from '@ynput/ayon-react-components'
import React from 'react'
import BundleDepPackage from './BundleDepPackage'

const BundleDeps = ({ bundle }) => {
  return (
    <section style={{ flex: 1, overflow: 'hidden' }}>
      <h2>
        Dependency packages <span>(auto-builds & uploads coming soon)</span>
      </h2>
      {bundle && (
        <FormLayout style={{ maxWidth: 'max-content', minWidth: 500 }}>
          <BundleDepPackage label="Windows">{bundle.dependencyPackages?.windows}</BundleDepPackage>
          <BundleDepPackage label="Linux">{bundle.dependencyPackages?.linux}</BundleDepPackage>
          <BundleDepPackage label="MacOS">{bundle.dependencyPackages?.darwin}</BundleDepPackage>
        </FormLayout>
      )}
    </section>
  )
}

export default BundleDeps
