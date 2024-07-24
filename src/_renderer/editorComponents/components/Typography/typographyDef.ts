import { mdiFormatText } from '@mdi/js'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { typographyPropsSchema } from './typographyPropsRawSchema'
import { Typography } from '@mui/material'
import { HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS } from '../../../defs/HTMLTagNamesDict'
import { TypographyWrapper } from './TypographyWrapper'

export const typographyEditorComponentDef = {
  type: 'Typography' as const,
  props: {
    children: 'test',
    noWrap: false,
    align: 'inherit',
    variant: 'body1',
    sx: {},
  },
  formGen: () =>
    propertyFormFactory(typographyPropsSchema, {
      dynamicOptionsDict: {
        component: [
          { value: undefined, label: 'Default (depends on variant)' },
          ...HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS,
        ],
      },
    }),

  icon: mdiFormatText,
  category: 'basic',
  component: TypographyWrapper,
  schema: typographyPropsSchema,
}
//
