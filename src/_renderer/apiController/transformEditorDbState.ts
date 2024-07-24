import {
  EditorStateType,
  ElementKeyType,
  defaultEditorState,
} from '../editorController/editorState'
import { isComponentType } from '../renderer/utils'
import { reloadSerializedThemes } from './transformEditorStateTheme'
import { EditorStateDbDataType } from './types'

export const transformEditorStateFromPayload = (
  data: EditorStateDbDataType,
  currentEditorState = defaultEditorState(),
  componentsIn: any[],
  disableThemeReload = false
): EditorStateType => {
  //   console.log('DATA !', data)
  const {
    selected_css_selector,
    selected_element,
    selected_font,
    selected_image,
    selected_page,
    selected_server_setting,
    selected_state,
    selected_entity,
    selected_entity_element,
    active_tab,
    active_backend_tab,
    pointer_mode,
    default_theme: defaultTheme,
    ...project
  } = data?.project ?? {}

  const ui = {
    ...(currentEditorState?.ui ?? {}),
    selected: {
      ...(currentEditorState?.ui?.selected ?? {}),
      cssSelector: selected_css_selector ?? null,
      element: selected_element ?? null,
      font: selected_font ?? null,
      image: selected_image ?? null,
      page: selected_page ?? null,
      serverSetting: selected_server_setting ?? 'ssl',
      state: selected_state ?? null,
      entity: selected_entity ?? null,
      entityElement: selected_entity_element ?? 'fields',
    },
    navigationMenu: {
      ...(currentEditorState?.ui?.navigationMenu ?? {}),
      activeTab: active_tab as any,
      activeBackendTab: active_backend_tab as any,
    },
    pointerMode: pointer_mode as any,
  }

  const newImageAssets = {
    images: data?.images?.map?.((image) => ({
      ...((currentEditorState?.assets?.images?.find?.(
        (img) => img._id === image.asset_id
      ) ?? {}) as any),
      _id: image.asset_id,
      fileName: image.asset_filename,
      created_datetime: (image as any).created_datetime,
      edited_datetime: (image as any).edited_datetime,
      // src:
    })),
  }
  const allElements =
    data?.elements?.map?.((el) => ({
      ...(isComponentType(el.element_type as ElementKeyType)
        ? componentsIn.find((bc) => bc.type === el.element_type)
        : {}),
      _id: el.element_id,
      _userID: el.element_html_id,
      _parentId: el.parent_id,
      _content: el.content as any,
      _imageSrcId: el.image_src_id ?? undefined,
      _type: el.element_type as any,
      _disableDelete: el.element_disable_delete ?? undefined,
      _page: el.element_page as string,
      viewport: el.viewport,
      props: data?.props
        ?.filter?.((prop) => prop.element_id === el.element_id)
        ?.reduce((acc, prop) => {
          const value =
            [
              'items',
              'sx',
              'slotProps',
              'columns',
              'data',
              'filters',
              'fields',
            ].includes(prop.prop_name) ||
            (['children'].includes(prop.prop_name) &&
              el.element_type !== 'Typography')
              ? JSON.parse(prop.prop_value)
              : prop.prop_value === 'null'
              ? null
              : prop.prop_value === 'true'
              ? true
              : prop.prop_value === 'false'
              ? false
              : prop.prop_value
          return {
            ...acc,
            [prop.prop_name]: value,
            element_id: el?.viewport
              ? el.viewport_ref_element_id
              : el.element_id,
          }
        }, {}),
      attributes: data?.attributes
        ?.filter?.((attr) => attr.element_id === el.element_id)
        ?.reduce((acc, attr) => {
          const value =
            attr.attr_name === 'style' && typeof attr.attr_value === 'string'
              ? JSON.parse(attr.attr_value)
              : attr.attr_value
          return {
            ...acc,
            [attr.attr_name]: value,
            element_id: el?.viewport
              ? el.viewport_ref_element_id
              : el.element_id,
          }
        }, {}),
      viewport_ref_element_id: el.viewport_ref_element_id,
      _viewportAreChildrenChanged: (el as any)?.viewport_are_children_changed,
    })) ?? []
  const baseViewportElements = allElements.filter((el) => !el?.viewport)

  // const elementsOtherViewports =

  const elements = [...baseViewportElements]
  const alternativeElements = allElements
    .filter((el) => el?.viewport)
    ?.map((el) => ({
      ...el,
      _id: el.viewport_ref_element_id as string,
      viewport_ref_element_id: el._id,
    }))
  const alternativeViewports = {
    sm: alternativeElements.filter((el) => el?.viewport === 'sm'),
    md: alternativeElements.filter((el) => el?.viewport === 'md'),
    lg: alternativeElements.filter((el) => el?.viewport === 'lg'),
    xl: alternativeElements.filter((el) => el?.viewport === 'xl'),
  }

  return {
    ...currentEditorState,
    defaultTheme: defaultTheme as any,
    alternativeViewports,
    project,
    elements,
    cssSelectors:
      (data?.cssSelectors?.map?.((cssSelector) => ({
        ...cssSelector,
        _id: cssSelector.css_selector_id,
        _userId: cssSelector.css_selector_name,
      })) as any[]) ?? [],
    ui,
    assets: newImageAssets,
    themes: disableThemeReload
      ? (data.themes as any)
      : reloadSerializedThemes(data.themes as any, currentEditorState?.themes),
  }
}
