import { mdiNoteOutline } from '@mdi/js'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { paperPropsSchema } from './paperPropsRawSchema'
import { Paper } from '@mui/material'

export const paperDef = {
  type: 'Paper' as const,
  props: {
    // children: "test",
    // noWrap: false,
    // align: "inherit",,

    children: [],
  },

  formGen: () => propertyFormFactory(paperPropsSchema),
  icon: mdiNoteOutline,
  category: 'surface',
  schema: paperPropsSchema,
  component: Paper,
}
