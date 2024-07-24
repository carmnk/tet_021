import { mdiListBoxOutline } from '@mdi/js'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { formPropsSchema } from './formPropsRawSchema'
import { GenericForm } from '@cmk/fe_utils'
import { EditorControllerType } from '../../../editorController/editorControllerTypes'

export const formEditorComponentDef = {
  type: 'Form' as const,

  component: GenericForm,
  formGen: (editorController: EditorControllerType, selectedElement: any) =>
    propertyFormFactory(formPropsSchema, {
      dynamicKeysDict: {
        fields: (f: any, g: any) => {
          return [
            {
              name: '',
              label: '',
              type: 'text',
              sx: {},
              width12: 12,
              fillWidth: true,
              required: false,
              disabled: false,
              disableHelperText: false,
              disableLabel: false,
              tooltip: '',
              placeholder: '',
            },
          ]
        },
      },
    }),
  props: {
    fields: [],
  },

  icon: mdiListBoxOutline,
  category: 'data',
  schema: formPropsSchema,
}
