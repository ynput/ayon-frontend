import { Section } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'

const MarketPage = () => {
  return (
    <main style={{ flexDirection: 'column' }}>
      <h1 className={Type.headlineSmall}>Addon Market</h1>
      <Section></Section>
    </main>
  )
}

export default MarketPage
