import { useState, useEffect, useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { Button, Dialog, Icon } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'

import styled from 'styled-components'

import {
  useSetRawAddonSettingsOverridesMutation,
  useLazyGetRawAddonSettingsOverridesQuery,
} from '@queries/addonSettings'
import { copyToClipboard, getRequestErrorString } from '@shared/util'
import {
  DialogBody,
  DialogFooter,
  DialogSubtitle,
  JSON_DIALOG_STYLE,
  JsonCodeEditor,
  getJsonProblem,
  parseJson,
  toJson,
} from '@components/JsonCodeEditor'

// Laid over the editor until it is acknowledged: the editor stays in view behind it, dimmed
const WarningOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--padding-l, 16px);
`

const WarningCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--base-gap-large);
  max-width: 440px;
  padding: 20px 24px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: 0 8px 24px var(--md-sys-color-shadow);

  .warning-title {
    display: flex;
    align-items: center;
    gap: var(--base-gap-large);
    margin: 0;
    font-size: var(--md-sys-typescale-title-medium-font-size);
    font-weight: var(--md-sys-typescale-title-medium-font-weight);
    line-height: var(--md-sys-typescale-title-medium-line-height);
  }

  .warning-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--md-sys-color-warning-container);
    color: var(--md-sys-color-on-warning-container);
  }

  p {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  button {
    align-self: flex-end;
    margin-top: var(--base-gap-small);
  }
`

// which overrides the editor holds
const getScopeLabel = (projectName, siteId) => {
  if (siteId)
    return projectName ? `${siteId} site overrides in ${projectName}` : `${siteId} site overrides`
  if (projectName) return `${projectName} project overrides`
  return 'Studio overrides'
}

/**
 * An addon's saved overrides as JSON (the addon list's "Low-level editor"). Unlike a group's raw
 * settings (SettingsJsonDialog), it saves them straight away
 */
const RawSettingsDialog = ({
  addonName,
  addonVersion,
  variant,
  siteId,
  projectName,
  reloadAddons,
  onClose,
}) => {
  const [code, setCode] = useState('')
  // the overrides as saved: unset until they load
  const [saved, setSaved] = useState(undefined)
  const [loadError, setLoadError] = useState(undefined)

  const [triggerGetSettings] = useLazyGetRawAddonSettingsOverridesQuery()
  const [saveSettings, { isLoading: isSaving }] = useSetRawAddonSettingsOverridesMutation()
  const [warn, setWarn] = useState(true)

  useEffect(() => {
    let isCurrent = true
    const loadNodeData = async () => {
      const overrides = await triggerGetSettings({
        addonName,
        addonVersion,
        projectName: projectName || '_',
        siteId: siteId || '_',
        variant,
      })

      if (!isCurrent) return
      // a failed load is not "no overrides": it stays unloaded, so it can't be saved over
      if (overrides.error) {
        setLoadError(getRequestErrorString(overrides.error))
        return
      }
      setCode(toJson(overrides.data ?? {}))
      setSaved(overrides.data ?? {})
    }

    loadNodeData()
    return () => {
      isCurrent = false
    }
  }, [addonName, addonVersion, projectName, siteId, triggerGetSettings, variant])

  const parsed = useMemo(() => parseJson(code), [code])
  const loaded = saved !== undefined
  // overrides are a group of settings: the JSON has to parse, and stay one
  const problem = loaded ? getJsonProblem(parsed, saved) : undefined
  const changed = loaded && !problem && !isEqual(parsed.value, saved)

  const onSave = async () => {
    if (!changed || isSaving) return
    const data = parsed.value
    // pasted JSON is often minified or unevenly indented: show it laid out like on load
    setCode(toJson(data))

    try {
      await saveSettings({
        addonName,
        addonVersion,
        variant,
        projectName: projectName || '_',
        siteId: siteId || '_',
        data,
      }).unwrap()
    } catch (error) {
      toast.error(getRequestErrorString(error))
      return
    }

    setSaved(data)
    toast.success('Settings saved')
    reloadAddons([`${addonName}|${addonVersion}|${variant}|${siteId || '_'}|${projectName || '_'}`])
  }

  const footer = (
    <DialogFooter>
      <Button
        label="Copy"
        icon="content_copy"
        variant="text"
        disabled={!loaded}
        onClick={() => copyToClipboard(code)}
      />
      <Button
        label="Format"
        icon="format_align_left"
        variant="text"
        disabled={warn || !loaded || parsed.error !== undefined}
        onClick={() => parsed.error === undefined && setCode(toJson(parsed.value))}
      />
      <span className="spacer" />
      <Button label="Close" variant="text" onClick={() => onClose()} />
      <Button
        label="Save"
        icon="save"
        variant="filled"
        disabled={warn || !changed || isSaving}
        onClick={onSave}
      />
    </DialogFooter>
  )

  const warning = warn && (
    <WarningOverlay>
      <WarningCard role="alertdialog" aria-labelledby="raw-settings-warning-title">
        <h2 className="warning-title" id="raw-settings-warning-title">
          <span className="warning-icon">
            <Icon icon="warning" />
          </span>
          For advanced users only
        </h2>
        <p>
          These are the addon&apos;s saved overrides as raw JSON. Saving writes them straight to the
          server, without the checks of the settings form.
        </p>
        <p>A wrong value can stop the addon from working. Edit with care.</p>
        <Button label="Continue" variant="filled" autoFocus onClick={() => setWarn(false)} />
      </WarningCard>
    </WarningOverlay>
  )

  return (
    <Dialog
      header={`${addonName} ${addonVersion} ${variant} raw settings`}
      footer={footer}
      isOpen={true}
      size="lg"
      hideCancelButton
      style={JSON_DIALOG_STYLE}
      onClose={() => onClose()}
    >
      <DialogBody>
        <DialogSubtitle>{getScopeLabel(projectName, siteId)}</DialogSubtitle>
        <JsonCodeEditor
          value={code}
          onChange={setCode}
          error={loadError ? `Could not load the overrides: ${loadError}` : problem}
          overlay={warning}
          locked={warn}
        />
      </DialogBody>
    </Dialog>
  )
}

export default RawSettingsDialog
