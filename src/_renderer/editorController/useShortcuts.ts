import { useMemo, useCallback } from 'react'
import { getStylesFromClasses } from '../renderer/getStylesFromClasses'
import {
  AlternativeViewportElement,
  EditorStateType,
  ElementType,
} from './editorState'
import { baseComponents } from '../editorComponents/baseComponents'
export const getInitialStyles = (): React.CSSProperties => {
  return {
    display: 'block',
    position: 'static',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    color: 'rgba(0, 0, 0, 1)',
    backgroundColor: 'rgba(255, 255, 255, 1)',
  }
}

const getRecursiveChildren = (
  elements: ElementType[],
  parentId: string
): ElementType[] => {
  const children = elements.filter((el) => el._parentId === parentId)
  return children
    .map((child) => [child, ...getRecursiveChildren(elements, child._id)])
    .flat()
}

export const useShortcuts = (params: {
  editorState: EditorStateType
  customComponents?: any[]
}) => {
  const { editorState, customComponents } = params

  const currentViewportElements = useMemo(() => {
    const currentViewport = editorState.ui.selected.viewport
    if (currentViewport === 'xs') return editorState.elements
    const baseviewElements = editorState.elements
    const viewportElements = editorState.alternativeViewports[currentViewport]
    if (!viewportElements?.length) return baseviewElements
    let currentViewportsElements: AlternativeViewportElement[] =
      baseviewElements as any
    for (let v = 0; v < viewportElements.length; v++) {
      const viewportElement = viewportElements[v]
      const baseviewElementChildrenToRemove =
        viewportElement?._viewportAreChildrenChanged
          ? getRecursiveChildren(editorState.elements, viewportElement._id)
          : null
      const viewportElementChildren =
        viewportElement?._viewportAreChildrenChanged
          ? viewportElements.filter(
              (el) => el._parentId === viewportElement._id
            )
          : []
      currentViewportsElements = currentViewportsElements.map((el) => {
        if (el._id === viewportElement._id) {
          return viewportElement
        }
        return el
      })
      currentViewportsElements = currentViewportsElements.filter(
        (el) =>
          !baseviewElementChildrenToRemove?.map((el) => el._id).includes(el._id)
      )
      const viewportElementIdx = currentViewportsElements.findIndex(
        (el) => el._id === viewportElement._id
      )
      currentViewportsElements.splice(
        viewportElementIdx + 1,
        0,
        ...viewportElementChildren
      )
    }
    return currentViewportsElements
  }, [
    editorState.elements,
    editorState.alternativeViewports,
    editorState.ui.selected.viewport,
  ])

  const selectedHtmlElement = useMemo(() => {
    const id = editorState?.ui.selected.element
    return currentViewportElements?.find((el) => el._id === id) ?? null
  }, [editorState.ui.selected.element, currentViewportElements])

  const selectedPageHtmlElements2 = useMemo(() => {
    const selectedPage = editorState.ui.selected.page
    return (
      currentViewportElements?.filter((el) => el._page === selectedPage) ?? []
    )
  }, [editorState.ui.selected.page, currentViewportElements])
  /* eslint-enable react-hooks/exhaustive-deps */

  const selectedHtmlElementStyleAttributes2 = useMemo(() => {
    const className = (selectedHtmlElement as ElementType<'div'>)?.attributes
      ?.className
    return {
      ...getInitialStyles(),
      ...getStylesFromClasses(className ?? '', editorState?.cssSelectors),
      ...((selectedHtmlElement as any)?.attributes?.style ?? {}),
    }
  }, [
    selectedHtmlElement,
    editorState.cssSelectors,
    (selectedHtmlElement as ElementType<'div'>)?.attributes?.className,
  ])

  const getSelectedImage = useCallback(
    (imageId?: string) => {
      const selectedImageId = imageId ?? editorState.ui.selected.image
      const selectedImage =
        editorState.assets.images.find(
          (image) => image._id === selectedImageId
        ) ?? null
      return { ...selectedImage, imageSrcId: imageId ?? '' } as any
    },
    [editorState?.assets.images, editorState.ui.selected.image]
  )

  const COMPONENT_MODELS = useMemo(
    () => [...baseComponents, ...(customComponents ?? [])],
    [customComponents]
  )
  return {
    currentViewportElements,
    selectedHtmlElement,
    selectedPageHtmlElements2,
    selectedHtmlElementStyleAttributes2,
    getSelectedImage,
    COMPONENT_MODELS,
  }
}
