import { AttributeData } from '@shared/api'
import { entityTypesWithIcons, getEntityTypeIcon } from './getEntityTypeIcon'

type GetAttributesIcon = (name: string, type?: AttributeData['type'], hasEnum?: boolean) => string

export const getAttributeIcon: GetAttributesIcon = (name, type, hasEnum) => {
  let icon = 'format_list_bulleted'
  // some attributes have custom icons
  const customIcons: {
    [key: string]: string
  } = {
    status: 'arrow_circle_right',
    assignees: 'person',
    tags: 'local_offer',
    priority: 'keyboard_double_arrow_up',
    fps: '30fps_select',
    resolutionWidth: 'settings_overscan',
    resolutionHeight: 'settings_overscan',
    pixelAspect: 'stop',
    clipIn: 'line_start_diamond',
    clipOut: 'line_end_diamond',
    frameStart: 'line_start_circle',
    frameEnd: 'line_end_circle',
    handleStart: 'line_start_square',
    handleEnd: 'line_end_square',
    fullName: 'id_card',
    email: 'alternate_email',
    developerMode: 'code',
    productGroup: 'inventory_2',
    machine: 'computer',
    comment: 'comment',
    colorSpace: 'palette',
    description: 'description',
  }

  const typeIcons: {
    [key in AttributeData['type']]?: string
  } = {
    integer: 'pin',
    float: 'speed_1_2',
    boolean: 'radio_button_checked',
    datetime: 'calendar_month',
    list_of_strings: 'format_list_bulleted',
    list_of_integers: 'format_list_numbered',
    list_of_any: 'format_list_bulleted',
    list_of_submodels: 'format_list_bulleted',
    dict: 'format_list_bulleted',
    string: 'title',
  }

  if (customIcons[name]) {
    icon = customIcons[name]
  } else if (entityTypesWithIcons.includes(name)) {
    icon = getEntityTypeIcon(name)
  } else if (hasEnum) {
    icon = 'format_list_bulleted'
  } else if (type && typeIcons[type]) {
    icon = typeIcons[type]
  }

  return icon
}
