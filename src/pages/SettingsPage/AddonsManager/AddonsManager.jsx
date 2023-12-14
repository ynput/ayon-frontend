import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import AddonsManagerItems from './AddonsManagerItems'

const AddonsManager = () => {
  return (
    <Section>
      <Splitter style={{ height: '100%', padding: 8 }}>
        <SplitterPanel>
          <AddonsManagerItems />
        </SplitterPanel>
        <SplitterPanel>
          <div>Versions/deps/launchers</div>
        </SplitterPanel>
        <SplitterPanel>
          <div>bundles</div>
        </SplitterPanel>
        <SplitterPanel>
          <div>uploads</div>
        </SplitterPanel>
      </Splitter>
    </Section>
  )
}

export default AddonsManager
