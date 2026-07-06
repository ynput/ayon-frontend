import { useReviewCardsSettingsContext } from '@pages/ProjectListsPage/context/ReviewCardsSettingsContext'
import { SizeSlider } from '@shared/components'
import { SettingsPanel } from '@shared/components/SettingsPanel'

export default function ReviewCardsSettings() {
  const {
    gridHeight,
    displayStyle,
    onUpdateGridHeight,
    onUpdateGridHeightWithPersistence,
  } = useReviewCardsSettingsContext()

  const settings = displayStyle === "cards"
    ? [{
      id: 'grid-size',
      component: (
        <SizeSlider
          value={gridHeight}
          onChange={onUpdateGridHeight}
          onChangeComplete={onUpdateGridHeightWithPersistence}
          title="Grid size"
          id="grid-size-slider"
          min={90}
          max={300}
          step={10}
        />
      ),
    }] : []

  return (
    <SettingsPanel settings={settings} />
  )
}
