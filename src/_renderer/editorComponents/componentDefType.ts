import { ComponentType, ElementType } from 'react'
// import { GenericFormProps } from '../../components/forms/GenericForm'
import { ExtendedObjectSchemaType } from './rawSchema'
import { DynamicFormInjectionsType } from './propertiesFormFactory'
// import { EditorControllerType } from '../editorController/editorControllerTypes'

export type ComponentDefType = {
  type: string
  component: ComponentType
  propSchema: ExtendedObjectSchemaType // const prop field defs
  dynamicInjections: (
    editorController: any,
    selectedComponent: ElementType
  ) => DynamicFormInjectionsType

  //   formGen: () => GenericFormProps
  //   props: any // to be received from schema

  icon: string // mdi icon
  category: string
  state?: string // currently just tested for truthyness
}
