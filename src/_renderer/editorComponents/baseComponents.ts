import { mdiNoteOutline, mdiRectangleOutline } from '@mdi/js'
import { NavContainerComponentPropsFormFactory } from './components/NavigationContainer/NavContainerPropFormFactory'
import { buttonEditorComponentDef } from './components/Button/buttonDef'
import { buttonGroupEditorComponentDef } from './components/ButtonGroup/buttonGroupDef'
import { listNavEditorComponentDef } from './components/ListNav/listNavDef'
import { TabsComponentDef } from './components/Tabs/tabsDef'
import { BottomNavComponentDef } from './components/BottomNavigation/bottomNavDefDef'
import { appBarDef } from './components/AppBar/appBarDef'
import { chipEditorComponentDef } from './components/Chip/chipDef'
import { typographyEditorComponentDef } from './components/Typography/typographyDef'
import { tableEditorComponentDef } from './components/Table/TableDef'
import { formEditorComponentDef } from './components/Form/formDef'

export const baseComponents = [
  typographyEditorComponentDef,
  chipEditorComponentDef,
  // surface components
  appBarDef,
  {
    // to be seperated!
    ...appBarDef,
    type: 'Paper' as const,
    icon: mdiNoteOutline,
  },

  // Navigation components
  buttonEditorComponentDef,
  TabsComponentDef,
  BottomNavComponentDef,
  listNavEditorComponentDef,
  buttonGroupEditorComponentDef,

  tableEditorComponentDef,
  formEditorComponentDef,

  // Navigation container, currently treated specially/hardcoded (use for generic?)
  {
    type: 'NavContainer' as const,
    props: {
      // children: "test",
      // noWrap: false,
      // align: "inherit",
      navigationElementId: null,
      children: [],
    },
    formGen: NavContainerComponentPropsFormFactory,
    icon: mdiRectangleOutline,
    category: 'navigation',
  },
]

export type BaseComponentsType = typeof baseComponents
export type BaseComponentType = BaseComponentsType[number]
