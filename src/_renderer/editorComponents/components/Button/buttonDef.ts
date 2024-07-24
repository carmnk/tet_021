import { mdiButtonCursor } from '@mdi/js'
// import { Button } from '../../../../components/buttons/Button/Button'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { ButtonPropsSchema } from './buttonPropsRawSchema'
import { ComponentDefType } from '../../componentDefType'
import { HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS } from '../../../defs/HTMLTagNamesDict'
import { Button } from '@cmk/fe_utils'

export const buttonEditorComponentDef = {
  type: 'Button' as const,

  component: Button,
  formGen: () =>
    propertyFormFactory(ButtonPropsSchema, {
      dynamicOptionsDict: {
        component: [
          { value: undefined, label: 'Default (depends on variant)' },
          ...HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS,
        ],
      },
    }),
  props: {
    type: 'primary',
    label: 'test2324____r',
    disabled: false,
    loading: false,
    iconButton: false,
    size: 'medium',
    sx: {},
    slotProps: {
      typography: {},
      startIcon: {},
      endIcon: {},
      tooltip: {},
    },
  },

  icon: mdiButtonCursor,
  category: 'basic',
  schema: ButtonPropsSchema,
}

export const newButtonEditorComponentDef: ComponentDefType = {
  type: 'Button' as const,

  component: Button,
  propSchema: ButtonPropsSchema,
  dynamicInjections: () => ({ dynamicOptionsDict: {} }),

  icon: mdiButtonCursor,
  category: 'basic',
}
