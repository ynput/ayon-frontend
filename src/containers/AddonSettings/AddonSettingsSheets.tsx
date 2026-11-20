import { ReactNode, useRef } from 'react'
import { SettingsOutline } from '@containers/SettingsEditor/SettingsOutline'
import { useFlatSettingsLayoutClassName } from '@hooks/useFlatSettingsLayout'

type AddonSettingsSheetsProps = {
  /** The flat layout: one outline beside every sheet, in place of one per addon */
  flat: boolean
  children: ReactNode
}

/**
 * The selected addons' settings, one under another. In the flat layout they share one
 * outline, so every sheet starts at the same edge and the outline jumps between addons.
 * Each addon's editor scopes its group ids (AddonSettingsPanel), or the links would clash.
 */
export const AddonSettingsSheets = ({ flat, children }: AddonSettingsSheetsProps) => {
  const sheetsRef = useRef<HTMLDivElement>(null)
  const layoutClassName = useFlatSettingsLayoutClassName()

  if (!flat) return <>{children}</>

  return (
    <div className="settings-flat">
      <div className={layoutClassName}>
        <SettingsOutline sheetRef={sheetsRef} />
        <div className="settings-flat-sheet" ref={sheetsRef}>
          {children}
        </div>
      </div>
    </div>
  )
}
