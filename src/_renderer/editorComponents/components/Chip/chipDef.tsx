import { mdiInformation } from '@mdi/js'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { chipPropsSchema } from './chipPropsRawSchema'
import { HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS } from '../../../defs/HTMLTagNamesDict'
import { ChipWrapper } from './ChipWrapper'

export const chipEditorComponentDef = {
  type: 'Chip' as const,
  props: {
    label: 'test',
    size: 'medium',
    variant: 'filled',
    color: 'primary',
    clickable: false,
    disabled: false,
    sx: {},
  },
  formGen: () =>
    propertyFormFactory(chipPropsSchema, {
      dynamicOptionsDict: {
        component: [
          { value: undefined, label: 'Default (depends on variant)' },
          ...HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS,
        ],
      },
    }),
  icon: mdiInformation,
  category: 'basic',
  component: ChipWrapper,
  schema: chipPropsSchema,
}
//
