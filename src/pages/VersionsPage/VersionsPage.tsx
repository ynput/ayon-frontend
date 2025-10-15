import { FC } from 'react'
import VersionsProviders from './providers'
import VersionsTable from './components/VersionsTable/VersionsTable'
import { VersionsDataProvider } from './context/VersionsDataContext'
import { Section } from '@ynput/ayon-react-components'

interface VersionsPageProps {
  projectName: string
}

const VersionsPage: FC<VersionsPageProps> = ({ projectName }) => {
  return (
    <VersionsDataProvider projectName={projectName}>
      <VersionsProviders projectName={projectName}>
        <Section>
          <VersionsTable />
        </Section>
      </VersionsProviders>
    </VersionsDataProvider>
  )
}

export default VersionsPage
