import { mdiDockTop } from '@mdi/js'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { appBarPropsSchema } from './appBarPropsRawSchema'
import { AppBar } from '@mui/material'
import { HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS } from '../../../defs/HTMLTagNamesDict'
import { AppBarWrapper } from './AppBarWrapper'

export const appBarDef = {
  //   ...paperDef,
  type: 'AppBar' as const,
  props: {
    // children: "test",
    // noWrap: false,
    // align: "inherit",,
    sx: {},
    children: [],
  },

  formGen: () =>
    propertyFormFactory(appBarPropsSchema, {
      dynamicOptionsDict: {
        component: [
          { value: undefined, label: 'Default (depends on variant)' },
          ...HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS,
        ],
      },
    }),
  icon: mdiDockTop,
  category: 'surface',
  schema: appBarPropsSchema,
  component: AppBarWrapper,
}
