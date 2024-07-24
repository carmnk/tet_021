import { mdiTab } from '@mdi/js'
import { propertyFormFactory } from '../../propertiesFormFactory'
import { TabsPropsSchema } from './tabsPropsRawSchema'
import { HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS } from '../../../defs/HTMLTagNamesDict'
import { Tabs } from '@cmk/fe_utils'

export const TabsComponentDef = {
  type: 'Tabs' as const,
  props: {
    // children: "test",
    // noWrap: false,
    // align: "inherit",
    items: [{ value: 'test', label: 'test' }],
    sx: {},
    slotProps: {
      activeTab: {},
      inactiveTabs: {},
      tooltip: {},
      tabItemContainer: {},
      icon: {},
      typography: {},
    },
  },
  state: 'test',
  formGen: () =>
    propertyFormFactory(TabsPropsSchema, {
      dynamicOptionsDict: {
        component: [
          { value: undefined, label: 'Default (depends on variant)' },
          ...HTML_TAG_NAMES_STRUCTURED_NONVOID_OPTIONS,
        ],
      },
    }),
  //   formGen: ButtonGroupComponentPropsFormFactory,
  icon: mdiTab,
  category: 'navigation',
  component: Tabs,
  schema: TabsPropsSchema,
}
