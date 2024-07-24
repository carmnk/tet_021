import { cloneDeep, remove } from 'lodash'
import { CSSProperties } from 'react'
import { useCallback, Dispatch, SetStateAction, useMemo } from 'react'
import { EditorStateType, ComponentElementTypes } from '../editorState'
import { ElementType, AlternativeViewportElement } from '../editorState'
import { v4 as uuid } from 'uuid'
import { EditorControllerType } from '../editorControllerTypes'

export type EditorControllerHtmlElementActionsParams = {
  editorState: EditorStateType
  setEditorState: Dispatch<SetStateAction<EditorStateType>>
  selectedPageHtmlElements: EditorControllerType['selectedPageHtmlElements2']
  selectedHtmlElement: EditorControllerType['selectedHtmlElement'] | null
  selectedHtmlElementStyleAttributes: CSSProperties | null
  appController: EditorControllerType['appController']
  currentViewportElements: EditorControllerType['currentViewportElements']
  components: any[]
}

export const useEditorControllerElementActions = (
  params: EditorControllerHtmlElementActionsParams
) => {
  const {
    editorState,
    setEditorState,
    selectedHtmlElement,
    selectedHtmlElementStyleAttributes,
    appController,
    currentViewportElements,
    components,
  } = params

  const getElementsAllParentIds = useCallback(
    (elementId: string, viewport?: 'sm' | 'md' | 'lg' | 'xl') => {
      const elements = viewport ? currentViewportElements : editorState.elements
      const element = elements.find((el) => el._id === elementId)
      if (!element) {
        return []
      }
      const parentIds = []
      let currentParentElementId = element._parentId
      while (currentParentElementId) {
        parentIds.push(currentParentElementId)
        const currentElement = elements.find(
          (el) => el._id === currentParentElementId
        )
        if (!currentElement) {
          break
        }
        currentParentElementId = currentElement._parentId
      }
      return parentIds
    },
    [currentViewportElements, editorState.elements]
  )

  const getAllElementsBeforeElement = useCallback(
    (elementId: string, viewport?: 'sm' | 'md' | 'lg' | 'xl') => {
      const elements = viewport ? currentViewportElements : editorState.elements
      const element = elements.find((el) => el._id === elementId)
      if (!element) {
        return []
      }
      const parentIds = getElementsAllParentIds(elementId)
      if (!parentIds?.length) {
        return [] // root element
      }
      let childId = elementId
      const elementsBefore = []
      for (let p = 0; p < parentIds.length; p++) {
        const parentId = parentIds[p]
        const parent = elements.find((el) => el._id === parentId)
        if (!parent) {
          // cannot happen -> parentIds are valid via getElementsAllParentIds()
          return []
        }
        const parentChildren = elements.filter(
          (el) => el._parentId === parentId
        )
        const currentParentsChildIdx = parentChildren.findIndex(
          (el) => el._id === childId
        )
        const elementsBeforeCurrentElement = parentChildren.slice(
          0,
          currentParentsChildIdx
        )
        const elementsBeforeCurrentElementIds =
          elementsBeforeCurrentElement.map((el) => el._id)
        childId = parentId
        elementsBefore.unshift(...elementsBeforeCurrentElementIds)
        elementsBefore.unshift(parentId)
      }

      return elementsBefore
    },
    [editorState.elements, getElementsAllParentIds, currentViewportElements]
  )

  const actions = useMemo(() => {
    const changeHtmlElementEditedCssRuleValue = (
      newValue: string,
      activeEditRule: string
    ) => {
      actions.changeCurrentHtmlElementStyleAttribute(
        newValue,
        activeEditRule ?? ''
      )
      setEditorState((current) => ({
        ...current,
        ui: {
          ...current.ui,
          detailsMenu: {
            ...current.ui.detailsMenu,
            htmlElement: {
              ...current.ui.detailsMenu.htmlElement,
              editCssRuleName: null,
              editCssRuleValue: null,
            },
          },
        },
      }))
    }
    const changeCurrentHtmlElement = (
      newHtmlElementIn: ElementType | ((current: ElementType) => ElementType)
    ) => {
      if (!selectedHtmlElement) return
      const currentViewport = editorState.ui.selected.viewport
      if (currentViewport !== 'xs') {
        actions.changeCurrentViewportSpecificElement(newHtmlElementIn as any)
        return
      }
      const newHtmlElement =
        typeof newHtmlElementIn === 'function'
          ? newHtmlElementIn(selectedHtmlElement)
          : newHtmlElementIn

      setEditorState((current) => {
        const currentElement = current.elements.find(
          (el) => el._id === newHtmlElement._id
        )
        const newStateNewElement: ElementType = {
          ...newHtmlElement,
          _parentId: currentElement?._parentId ?? null,
        }
        return {
          ...current,
          elements: current.elements.map((el) =>
            el._id === newHtmlElement._id ? newStateNewElement : el
          ),
        }
      })
    }
    const changeCurrentHtmlElementStyleAttribute = (
      ruleValue: string,
      ruleName: string
    ) => {
      if (!selectedHtmlElement) return

      actions.changeCurrentHtmlElement((current) => {
        const currentAttributes =
          'attributes' in current ? current.attributes : {}
        const newAttributes = {
          ...currentAttributes,
          style: {
            ...(currentAttributes?.style ?? {}),
            [ruleName]: ruleValue,
          },
        }
        return {
          ...current,
          attributes: newAttributes as any,
        }
      })
    }
    const changeCurrentHtmlElementAttribute = (
      attributeName: string,
      attributeValue: string
    ) => {
      actions.changeCurrentHtmlElement((current) => {
        const currentAttributes =
          'attributes' in current ? current.attributes : {}
        const newAttributes = {
          ...currentAttributes,
          [attributeName]: attributeValue,
        }
        return {
          ...current,
          attributes: newAttributes as any,
        }
      })
    }
    const changeCurrentViewportSpecificElement = (
      newElementIn:
        | AlternativeViewportElement
        | ((current: AlternativeViewportElement) => AlternativeViewportElement)
    ) => {
      const currentViewport = editorState.ui.selected.viewport
      if (!selectedHtmlElement || currentViewport === 'xs') {
        console.warn('THIS FUNCTION REQUIRES A SELECTED ELEMENT!')
        return
      }
      const newElement =
        typeof newElementIn === 'function'
          ? newElementIn(selectedHtmlElement as any)
          : newElementIn
      const newElementId = newElement._id

      setEditorState((current) => {
        // viewportElements includes ONLY VIEWPORT SPECIFIC ELEMENTS
        const viewportElements =
          editorState.alternativeViewports[currentViewport]
        const viewportspecificElement = viewportElements.find(
          (el) => el._id === newElementId
        )
        const doesElementExistInViewport = !!viewportspecificElement
        // if already a viewport specific element -> just replace
        if (doesElementExistInViewport) {
          return {
            ...current,
            alternativeViewports: {
              ...current.alternativeViewports,
              [currentViewport]: current.alternativeViewports[
                currentViewport
              ].map((el) => (el._id === newElementId ? newElement : el)),
            },
          }
        }
        // OTHERWISE if not a viewport specific element -> add it
        const parentIds = getElementsAllParentIds(newElementId)
        const parentId = parentIds?.[0]
        // const parentId = newElement._parentId
        // if element has no parent (root element) -> add at the beginning of the array
        if (!parentId) {
          return {
            ...current,
            alternativeViewports: {
              ...current.alternativeViewports,
              [currentViewport]: [
                newElement,
                ...(current.alternativeViewports[currentViewport] ?? []),
              ],
            },
          }
        }
        const elementsBefore = getAllElementsBeforeElement(
          newElementId,
          currentViewport
        )
        let pasteIndex2: number | null = null
        for (let e = 0; e < elementsBefore.length; e++) {
          const idx = viewportElements.findIndex(
            (el) => el._id === elementsBefore[e]
          )
          if (idx === -1) {
            continue
          }
          if (idx > (pasteIndex2 ?? 0)) {
            pasteIndex2 = idx
          }
        }
        if (pasteIndex2 === null) {
          console.warn('PASTE INDEX NOT FOUND, inserted at END ')
          return {
            ...current,
            alternativeViewports: {
              ...current.alternativeViewports,
              [currentViewport]: [
                ...(current.alternativeViewports[currentViewport] ?? []),
                newElement,
              ],
            },
          }
        } else {
          return {
            ...current,
            alternativeViewports: {
              ...current.alternativeViewports,
              [currentViewport]: [
                ...viewportElements.slice(0, pasteIndex2 + 1),
                newElement,
                ...viewportElements.slice(pasteIndex2 + 1),
              ],
            },
          }
        }
      })
    }
    const changeCurrentElementProp = (
      propName: keyof ElementType,
      propValue: string,
      elementId?: string
    ) => {
      actions.changeCurrentHtmlElement((current) => {
        return {
          ...current,
          [propName]: propValue,
        }
      })
    }
    const changeElementProp = (
      elementId: string,
      propName: keyof ElementType,
      propValue: string
    ) => {
      const currentViewport = editorState.ui.selected.viewport
      if (currentViewport !== 'xs') {
        const currentElement = currentViewportElements.find(
          (el) => el._id === elementId
        )
        if (!currentElement) {
          console.warn(
            'editorControllerElementActions.ts - changeElementProp - element not found',
            elementId
          )
          return
        }
        actions.changeCurrentViewportSpecificElement((current) => {
          return {
            ...current,
            [propName]: propValue,
          }
        })
        return
      }
      setEditorState((current) => ({
        ...current,
        elements: current.elements.map((el) =>
          el._id === elementId
            ? {
                ...el,
                [propName]: propValue,
              }
            : el
        ),
      }))
    }
    const deleteElement = (id: string | number) => {
      const currentViewport = editorState.ui.selected.viewport
      if (currentViewport !== 'xs') {
        const currentViewport = editorState.ui.selected.viewport

        const currentElement = currentViewportElements.find(
          (el) => el._id === id
        )
        const currentParentElement = currentViewportElements.find(
          (el) => el._id === currentElement?._parentId
        )
        const currentChildElements = currentViewportElements.filter(
          (el) => el._parentId === currentParentElement?._id
        )
        if (
          currentViewport === 'xs' ||
          !currentElement ||
          !currentParentElement ||
          !currentChildElements
        ) {
          console.warn(
            'editorControllerElementActions.ts - deleteElement - something went wrong'
          )
          return
        }
        const newChildElements = currentChildElements.filter(
          (el) => el._id !== id
        )
        actions.changeCurrentViewportSpecificElementChildren(
          currentParentElement._id,
          newChildElements as any
        )
        return
      }
      setEditorState((current) => ({
        ...current,
        elements: current.elements.filter((el) => el._id !== id),
      }))
    }
    const addElementChild = (
      parentElementId: string,
      newElementType?: string
    ) => {
      const currentViewport = editorState.ui.selected.viewport
      if (currentViewport !== 'xs') {
        const parentElement = currentViewportElements.find(
          (el) => el._id === parentElementId
        )
        if (!parentElement) {
          console.warn(
            'editorControllerElementActions.ts - addElementChild - element to add into not found',
            parentElementId
          )
          return
        }
        const newElement = {
          _id: uuid(),
          _type: (newElementType as any) ?? 'div',
          _parentId: parentElementId,
          _page: parentElement._page,
          _userID: '',
          attributes: {},
        }
        const currentChildren = currentViewportElements.filter(
          (el) => el._parentId === parentElementId
        )
        const newChildren = [...currentChildren, newElement]
        actions.changeCurrentViewportSpecificElementChildren(
          parentElementId,
          newChildren as any
        )
        return
      }
      setEditorState((current) =>
        !current.ui.selected.page
          ? current
          : {
              ...current,

              elements: [
                ...current.elements,
                {
                  _id: uuid(),
                  _type: (newElementType as any) ?? 'div',
                  _parentId: parentElementId,
                  _page: current.ui.selected.page,
                  _userID: '',
                  attributes: {},
                },
              ],
              ui: {
                ...current.ui,
                navigationMenu: {
                  ...current.ui.navigationMenu,
                  expandedTreeItems:
                    current.ui.navigationMenu?.expandedTreeItems?.includes(
                      parentElementId
                    )
                      ? current.ui.navigationMenu?.expandedTreeItems
                      : [
                          ...(current.ui.navigationMenu?.expandedTreeItems ??
                            []),
                          parentElementId,
                        ],
                },
              },
            }
      )
    }
    const toggleHtmlElementEditCssRule = (attributeName: string) => {
      setEditorState((current) => ({
        ...current,
        ui: {
          ...current.ui,
          detailsMenu: {
            ...current.ui.detailsMenu,
            htmlElement: {
              ...current.ui.detailsMenu.htmlElement,
              editCssRuleName: current.ui.detailsMenu.htmlElement
                ?.editCssRuleName
                ? null
                : attributeName,
              editCssRuleValue: current.ui.detailsMenu.htmlElement
                ?.editCssRuleName
                ? null
                : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (selectedHtmlElementStyleAttributes as any)?.[
                    attributeName
                  ] ?? '',
            },
          },
        },
      }))
    }
    const removeCurrentHtmlElementStyleAttribute = (ruleName: string) => {
      if (!selectedHtmlElement) return
      actions.changeCurrentHtmlElement((current) => {
        const currentAttributes =
          'attributes' in current ? current.attributes : {}
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          [ruleName as keyof CSSProperties]: rOut,
          ...attributesExRemoved
        } = currentAttributes?.style ?? {}
        return {
          ...current,
          attributes: {
            ...(currentAttributes as any),
            style: attributesExRemoved,
          },
        }
      })
    }
    const changeSelectedComponentProp = (key: string, value: any) => {
      if (!selectedHtmlElement) return
      // TODO: Generic approad
      if (key === 'items') {
        const newTabNames = value
          .map((tab: any) => tab.value)
          ?.sort((a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0))
        const currentTabNames =
          (selectedHtmlElement as any)?.props?.items?.map?.(
            (tab: any) => tab.value
          ) || []
        // const currentTabNames = appController.values?.[selectedHtmlElement.id]?.sort(
        //   (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0)
        // );

        // Tabs are different!
        if (newTabNames?.join('') !== currentTabNames?.join('')) {
          // change state value in NavContainers
          console.log('CHANGE NavContainer, too and current tab if needed!')
        }
      }
      actions.changeCurrentHtmlElement((current) => {
        return {
          ...current,
          props: {
            ...((current as any).props ?? {}),
            [key]: value,
          },
        }
      })
    }
    const swapHtmlElements = (elementId: string, targetElementId: string) => {
      const currentViewport = editorState.ui.selected.viewport
      // specific viewport!
      if (currentViewport !== 'xs') {
        console.log(
          "SWAP ELEMENTS - CURRENT VIEWPORT ISN'T XS",
          currentViewport
        )
        const parentElement1Id = editorState.elements.find(
          (el) => el._id === elementId
        )?._parentId
        const parentElement2Id = editorState.elements.find(
          (el) => el._id === targetElementId
        )?._parentId
        const element1Raw =
          editorState.alternativeViewports[currentViewport].find(
            (el) => el._id === elementId
          ) ||
          (editorState.elements.find(
            (el) => el._id === elementId
          ) as AlternativeViewportElement)
        const element2Raw =
          editorState.alternativeViewports[currentViewport].find(
            (el) => el._id === targetElementId
          ) ||
          (editorState.elements.find(
            (el) => el._id === targetElementId
          ) as AlternativeViewportElement)
        if (
          !parentElement1Id ||
          !parentElement2Id ||
          !element1Raw ||
          !element2Raw
        ) {
          return
        }
        const element1 = cloneDeep(element1Raw)
        const element2 = cloneDeep(element2Raw)
        const viewportSpecificParent1 = editorState.alternativeViewports[
          currentViewport
        ].find((el) => el._id === parentElement1Id)
        const parent1Children =
          viewportSpecificParent1 &&
          viewportSpecificParent1._viewportAreChildrenChanged
            ? editorState.alternativeViewports[currentViewport].filter(
                (el) => el._parentId === parentElement1Id
              )
            : editorState.elements.filter(
                (el) => el._parentId === parentElement1Id
              )

        const viewportSpecificParent2 = editorState.alternativeViewports[
          currentViewport
        ].find((el) => el._id === parentElement2Id)

        const parent2Children =
          viewportSpecificParent2 &&
          viewportSpecificParent2._viewportAreChildrenChanged
            ? editorState.alternativeViewports[currentViewport].filter(
                (el) => el._parentId === parentElement2Id
              )
            : editorState.elements.filter(
                (el) => el._parentId === parentElement2Id
              )
        if (parentElement1Id === parentElement2Id) {
          const newParentChildren = parent1Children.map((el) =>
            el._id === elementId
              ? element2
              : el._id === targetElementId
              ? element1
              : el
          )
          actions.changeCurrentViewportSpecificElementChildren(
            parentElement1Id,
            newParentChildren as any
          )
          return
        } else {
          const newParentChildren1 = parent1Children.map((el) =>
            el._id === elementId ? element2 : el
          )
          const newParentChildren2 = parent2Children.map((el) =>
            el._id === targetElementId ? element1 : el
          )
          actions.changeCurrentViewportSpecificElementChildren(
            parentElement1Id,
            newParentChildren1 as any
          )
          actions.changeCurrentViewportSpecificElementChildren(
            parentElement2Id,
            newParentChildren2 as any
          )
        }
      }
      setEditorState((current) => {
        const element1 = cloneDeep(
          current.elements.find((el) => el._id === elementId)
        )
        const element2 = cloneDeep(
          current.elements.find((el) => el._id === targetElementId)
        )
        if (!element1 || !element2) return current
        return {
          ...current,
          elements: current.elements.map((el) =>
            el._id === elementId
              ? element2
              : el._id === targetElementId
              ? element1
              : el
          ),
        }
      })
    }
    const insertElementIntoElement = (
      elementId: string,
      targetElementId: string
    ) => {
      const currentViewport = editorState.ui.selected.viewport
      if (currentViewport !== 'xs') {
        const currentChildElements = currentViewportElements.filter(
          (el) => el._parentId === targetElementId
        )
        // const lastChildIndexes = currentChildElements.map((childEl) =>
        //   currentViewportElements.findIndex(
        //     (viewportEl) => viewportEl._id === childEl._id
        //   )
        // )
        const insertElement = currentViewportElements.find(
          (el) => el._id === elementId
        )
        if (!insertElement) {
          console.warn(
            'editorControllerElementActions.ts - insertElementIntoElement - element not found',
            elementId,
            insertElement
          )
          return
        }
        const insertElementAdj = {
          ...(insertElement ?? {}),
          _parentId: targetElementId,
        }
        // const lastChildIndex = Math.max(...lastChildIndexes)
        const newChildElements = [
          ...(currentChildElements?.filter?.((el) => el._id !== elementId) ??
            []),
          insertElementAdj,
        ]
        // will delete remove the new element from the viewport specific tree and only add as new child
        actions.changeCurrentViewportSpecificElementChildren(
          targetElementId,
          newChildElements as any
        )
        return
      }
      // SEQUENCE MUST BE CHANGED !!!
      setEditorState((current) => {
        return {
          ...current,
          elements: current.elements.map((el) =>
            el._id === elementId
              ? {
                  ...el,
                  _parentId: targetElementId,
                }
              : el
          ),
        }
      })
    }
    const changeComponentProp = (
      elementId: string,
      key: string,
      value: any
    ) => {
      const currentViewport = editorState.ui.selected.viewport
      if (currentViewport !== 'xs') {
        const currentElement = currentViewportElements.find(
          (el) => el._id === elementId
        )
        if (!currentElement) {
          console.warn(
            'editorControllerElementActions.ts - changeElementProp - element not found',
            elementId
          )
          return
        }
        actions.changeCurrentViewportSpecificElement((current) => {
          return {
            ...current,
            props: {
              ...((current as any).props ?? {}),
              [key]: value,
            },
          }
        })
        return
      }

      setEditorState((current) => ({
        ...current,
        elements: current.elements.map((el) =>
          el._id === elementId
            ? {
                ...el,
                props: {
                  ...((el as any).props ?? {}),
                  [key]: value,
                },
              }
            : el
        ),
      }))
    }
    const changeCurrentViewportSpecificElementChildren = (
      elementId: string,
      newChildren: AlternativeViewportElement[]
    ) => {
      const currentViewport = editorState.ui.selected.viewport
      if (currentViewport === 'xs') {
        console.warn('THIS FUNCTION REQUIRES A SELECTED ELEMENT!')
        return
      }
      setEditorState((current) => {
        const viewportElements = current.alternativeViewports[currentViewport]
        const viewportspecificElement = viewportElements.find(
          (el) => el._id === elementId
        )
        const doesElementExistInViewport = !!viewportspecificElement
        // element's children have already been changed
        if (
          doesElementExistInViewport &&
          viewportspecificElement._viewportAreChildrenChanged
        ) {
          console.debug(
            "editorControllerElementActions.ts - changeCurrentViewportSpecificElementChildren - element's children have already been changed"
          )
          return current
          // element exists in the viewport specific tree and children have not yet been changed
        } else if (
          doesElementExistInViewport &&
          !viewportspecificElement._viewportAreChildrenChanged
        ) {
          const viewportElementsExNewChildren = viewportElements.filter(
            (el) => !newChildren.find((child) => child._id === el._id)
          )
          const parentElementIdx = viewportElementsExNewChildren.findIndex(
            (el) => el._id === elementId
          )
          const newViewportElements = [
            ...viewportElementsExNewChildren.slice(0, parentElementIdx + 1),
            ...newChildren,
            ...viewportElementsExNewChildren.slice(parentElementIdx + 1),
          ].map((el) => {
            const newParentElement = {
              ...el,
              _viewportAreChildrenChanged: true,
            }
            return el._id === elementId ? newParentElement : el
          })

          console.debug(
            "editorControllerElementActions.ts - changeCurrentViewportSpecificElementChildren - element's children have noet been changed yet",
            newViewportElements
          )
          return {
            ...current,
            alternativeViewports: {
              ...current.alternativeViewports,
              [currentViewport]: newViewportElements,
            },
          }
          // element does not yet exist in the viewport specific tree
        } else {
          console.debug('HELLO')
          const currentElementIn = current.elements.find(
            (el) => el._id === elementId
          )
          if (!currentElementIn) {
            console.error('ELEMENT NOT FOUND in elements tree')
            return current
          }
          const currentElement = {
            ...currentElementIn,
            _viewportAreChildrenChanged: true,
          }
          const elementsBefore = getAllElementsBeforeElement(
            elementId,
            currentViewport
          )
          const currentViewportElementsExNewChildren = viewportElements.filter(
            (el) => !newChildren.find((child) => child._id === el._id)
          )
          let pasteIndex2: number | null = null
          for (let e = 0; e < elementsBefore.length; e++) {
            const idx = currentViewportElementsExNewChildren.findIndex(
              (el) => el._id === elementsBefore[e]
            )
            if (idx === -1) {
              continue
            }
            if (idx > (pasteIndex2 ?? 0)) {
              pasteIndex2 = idx
            }
          }
          console.debug(
            'editorControllerElementActions.ts - changeCurrentViewportSpecificElementChildren - element does not exist yet in viewport',
            currentViewportElementsExNewChildren,
            'new elements',
            [
              ...(currentViewportElementsExNewChildren ?? []),
              currentElement,
              ...newChildren,
            ]
          )
          if (pasteIndex2 === null) {
            console.warn('PASTE INDEX NOT FOUND, inserted at END ')

            return {
              ...current,
              alternativeViewports: {
                ...current.alternativeViewports,
                [currentViewport]: [
                  ...(currentViewportElementsExNewChildren ?? []),
                  currentElement,
                  ...newChildren,
                ],
              },
            }
          } else {
            return {
              ...current,
              alternativeViewports: {
                ...current.alternativeViewports,
                [currentViewport]: [
                  ...currentViewportElementsExNewChildren.slice(
                    0,
                    pasteIndex2 + 1
                  ),
                  currentElement,
                  ...newChildren,
                  ...currentViewportElementsExNewChildren.slice(
                    pasteIndex2 + 1
                  ),
                ],
              },
            }
          }
        }
      })
    }
    const addComponentChild = (
      parentElementId: string,
      type: ComponentElementTypes
    ) => {
      const defaultComponentProps = components.find(
        (comp) => comp.type === type
      )
      const _id = uuid()
      const currenViewport = editorState.ui.selected.viewport
      const currenPage = editorState.ui.selected.page
      const newElement = {
        props: {},
        ...(defaultComponentProps as any), // -> TODO -> untangle instance and template
        _id,
        _page: currenPage,
        _userID: '',
        // _content: newElement.content,
        _type: type,
        // _imageSrcId: newElement.imageSrcId,
        // attributes: newElement.attributes,
        _parentId: parentElementId,
      }

      if (currenViewport !== 'xs') {
        const parentElement = currentViewportElements.find(
          (el) => el._id === parentElementId
        )
        if (!parentElement) {
          console.warn(
            'editorControllerElementActions.ts - addElementChild - element to add into not found',
            parentElementId
          )
          return
        }
        const currentChildren = currentViewportElements.filter(
          (el) => el._parentId === parentElementId
        )
        const newChildren = [...currentChildren, newElement]
        actions.changeCurrentViewportSpecificElementChildren(
          parentElementId,
          newChildren
        )

        return
      }

      setEditorState((current) =>
        !current.ui.selected.page
          ? current
          : {
              ...current,
              elements: [...current.elements, newElement],
              ui: {
                ...current.ui,
                navigationMenu: {
                  ...current.ui.navigationMenu,
                  expandedTreeItems:
                    current.ui.navigationMenu?.expandedTreeItems?.includes(
                      parentElementId
                    )
                      ? current.ui.navigationMenu.expandedTreeItems
                      : [
                          ...(current.ui.navigationMenu.expandedTreeItems ??
                            []),
                          parentElementId,
                        ],
                },
              },
            }
      )
      if ('state' in (defaultComponentProps ?? {})) {
        appController.actions.addProperty(
          _id,
          (defaultComponentProps as any)?.state ?? ''
        )
      }
    }

    return {
      changeHtmlElementEditedCssRuleValue,
      changeCurrentHtmlElement,
      changeCurrentHtmlElementStyleAttribute,
      changeCurrentHtmlElementAttribute,
      changeCurrentViewportSpecificElement,
      changeCurrentElementProp,
      changeElementProp,
      deleteElement,
      addElementChild,
      toggleHtmlElementEditCssRule,
      removeCurrentHtmlElementStyleAttribute,
      changeSelectedComponentProp,
      swapHtmlElements,
      insertElementIntoElement,
      changeComponentProp,
      changeCurrentViewportSpecificElementChildren,
      addComponentChild,
    }
  }, [
    setEditorState,
    selectedHtmlElement,
    editorState.ui.selected.viewport,
    currentViewportElements,
    selectedHtmlElementStyleAttributes,
    editorState.alternativeViewports,
    editorState.elements,
    getAllElementsBeforeElement,
    getElementsAllParentIds,
    appController.actions,
    editorState.ui.selected.page,
  ])

  return actions
}
