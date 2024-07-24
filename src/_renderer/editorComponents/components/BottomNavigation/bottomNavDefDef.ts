import { mdiDockBottom } from '@mdi/js'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { BottomNavPropsSchema } from './bottomNavPropsRawSchema'
import { HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS } from '../../../defs/HTMLTagNamesDict'
import { BottomNavigation } from '@cmk/fe_utils'

export const BottomNavComponentDef = {
  type: 'BottomNavigation' as const,
  props: {
    // children: "test",
    // noWrap: false,
    // align: "inherit",
    items: [{ value: 'test', label: 'test' }],
    sx: {},
    slotProps: {
      bottomNavigationAction: {},
    },
  },
  state: 'test',
  formGen: () =>
    propertyFormFactory(BottomNavPropsSchema, {
      dynamicOptionsDict: {
        component: [
          { value: undefined, label: 'Default (depends on variant)' },
          ...HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS,
        ],
      },
    }),
  //   formGen: ButtonGroupComponentPropsFormFactory,
  icon: mdiDockBottom,
  category: 'navigation',
  component: BottomNavigation,
  schema: BottomNavPropsSchema,
}
