import {
  AlternativeViewportElement,
  EditorStateType,
} from '../editorController/editorState'
import { v4 as uuid } from 'uuid'
import { transformEditorStateTheme } from './transformEditorStateTheme'
import { EditorStateDbDataType } from './types'
import { toBase64 } from '../utils/file'

export const transformEditorStateToPayload = (
  payload: EditorStateType,
  includeBase64Images = false
): EditorStateDbDataType | null => {
  const projectIn = payload?.project ?? {}
  const project_id = projectIn.project_id
  if (!project_id) {
    alert('project_id is missing')
    console.warn(
      'project_id is missing:',
      projectIn,
      `(projectIn)`,
      payload,
      `(payload)`
    )
    return null
  }
  const uiIn = payload.ui as Omit<EditorStateType['ui'], 'detailsMenu'>
  const {
    page = null,
    cssSelector = null,
    image = null,
    state = null,
    element = null,
    font = null,
    serverSetting = null,
    entity = null,
    entityElement = null,
  } = uiIn.selected
  // save with project
  const uiOut = {
    selected_page: page,
    selected_server_setting: serverSetting,
    selected_css_selector: cssSelector,
    selected_image: image,
    selected_state: state,
    selected_element: element,
    selected_font: font,
    active_tab: uiIn?.navigationMenu?.activeTab ?? null,
    active_backend_tab: uiIn?.navigationMenu?.activeBackendTab ?? null,
    pointer_mode: uiIn?.pointerMode ?? null,
    selected_entity: entity,
    selected_entity_element: entityElement ?? null,
  }
  const projectOut = {
    ...projectIn,
    ...uiOut,
    default_theme: payload.defaultTheme,
  }
  // insert project and retrieve id

  const elementsInBaseViewport =
    payload?.elements?.map((el) => ({ ...el, viewport: null })) || []

  const alternativeVewportKeys = Object.keys(
    payload?.alternativeViewports || {}
  )
  const elementsInOtherViewports = alternativeVewportKeys
    .map(
      (viewportKey) =>
        payload?.alternativeViewports?.[
          viewportKey as keyof typeof payload.alternativeViewports
        ]?.map((el) => ({ ...el, viewport: viewportKey })) || []
    )
    .flat()
  const elementsIn = [...elementsInBaseViewport, ...elementsInOtherViewports]

  const elementsOut = elementsIn.map((element) => {
    return {
      element_id: element?.viewport
        ? element.viewport_ref_element_id ?? uuid()
        : element._id,
      element_html_id: element?._userID ?? null,
      project_id,
      // _user,
      parent_id: element?._parentId ?? null,
      content: element?._content ?? null,
      image_src_id: element?._imageSrcId ?? null,
      element_type: element?._type ?? null,
      element_disable_delete: element?._disableDelete ?? null,
      element_page: element?._page ?? null,
      viewport: element?.viewport ?? null,
      viewport_are_children_changed:
        (element as AlternativeViewportElement)?._viewportAreChildrenChanged ??
        null,
      viewport_ref_element_id: element._id ?? null,
    }
  })

  // stringify props and attributes if value is objectish
  const props =
    elementsIn
      ?.map?.((el, eIdx) =>
        'props' in el && el.props
          ? Object.keys(el.props)
              .map((key) => {
                const elementOut = elementsOut[eIdx]
                const prop_value_raw = (el.props as any)?.[key]
                const prop_value = ['function', 'object'].includes(
                  typeof prop_value_raw
                )
                  ? JSON.stringify(prop_value_raw)
                  : prop_value_raw
                const newId = uuid()
                return {
                  prop_id: newId,
                  element_id: el?.viewport ? elementOut?.element_id : el._id,
                  prop_name: key,
                  prop_value,
                  project_id,
                  // _user,
                }
              })
              ?.filter(
                (prop) =>
                  (prop.prop_value ||
                    prop.prop_value === false ||
                    (prop as any).prop_name === 0) &&
                  prop.prop_name
              )
          : []
      )
      ?.flat() ?? []

  const attributes =
    elementsIn
      ?.map?.((el, eIdx) =>
        'attributes' in el && el.attributes
          ? Object.keys(el.attributes)
              .map((key) => {
                const elementOut = elementsOut[eIdx]
                const attr_value_raw = (el.attributes as any)?.[key]
                const matchingImageSrcSerializes =
                  (key === 'src' &&
                    typeof attr_value_raw === 'string' &&
                    payload.assets.images?.find(
                      (img) => img.src === attr_value_raw
                    )?._id) ||
                  null
                const attr_value = matchingImageSrcSerializes
                  ? matchingImageSrcSerializes
                  : ['function', 'object'].includes(typeof attr_value_raw)
                  ? JSON.stringify(attr_value_raw)
                  : attr_value_raw

                return {
                  attr_id: uuid(),
                  element_id: el?.viewport ? elementOut?.element_id : el._id,
                  attr_name: key,
                  attr_value,
                  project_id,
                  // _user,
                }
              })
              ?.filter((attr) => attr.attr_value && attr.attr_name)
          : []
      )
      ?.flat() ?? []

  const cssSelectorsIn = payload?.cssSelectors || []
  const cssSelectorsOut = cssSelectorsIn.map((cssSelector) => {
    return {
      css_selector_id: cssSelector._id,
      css_selector_name: cssSelector?.css_selector_name ?? [],
      project_id,
      // _user,
      //   selector_page?: string
      //   selector_type?: string
    }
  })

  // seperate handling! -> must be multipart form data!!!!
  const images = payload.assets.images?.map((image) => {
    return {
      asset_id: image._id,
      // image: typeof Image
      // src: string
      project_id,
      asset_filename: image.fileName,
    }
  })
  const imageFiles = payload.assets.images
    ?.filter((img) => (img as any)._upload)
    ?.map((image) => {
      return {
        asset_id: image._id,
        image: image.image as any,
        // image: includeBase64Images && image.image
        //   ? toBase64(image.image as any)
        //   : (image.image as any),
        // src: string
        //   fileName: image.fileName,
      }
    })

  const themes: EditorStateDbDataType['themes'] = transformEditorStateTheme(
    payload.themes,
    project_id
  )
  return {
    project: projectOut as any,
    elements: elementsOut,
    props,
    attributes,
    cssSelectors: cssSelectorsOut as any,
    images,
    imageFiles,
    themes,
  }
}
