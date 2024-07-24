import { ElementType } from '../editorController/editorState'
import { ElementBox } from './ElementBox'
import { AppBar, Box, Paper, Theme } from '@mui/material'
import { EditorControllerType } from '../editorController/editorControllerTypes'
import React from 'react'
import { PropertyType } from '../editorComponents/rawSchema'
import { TableProps } from '@cmk/fe_utils'
import { RootElementOverlay } from './RootElementOverlay'
import { isComponentType } from './utils'

export const isStringLowerCase = (str: string): boolean => {
  return str === str.toLowerCase()
}

export const renderHtmlElements = (
  elements: ElementType[],
  editorController: EditorControllerType,
  onSelectElement: (element: ElementType, isHovering: boolean) => void,
  tableUis: Record<
    string,
    {
      onSetFilters: TableProps['onSetFilters']
      filters: TableProps['filters']
    }
  >,
  theme: Theme,
  isProduction?: boolean,
  icons?: { [key: string]: string },
  parentId?: string,
  isPointerProduction?: boolean
): React.ReactNode => {
  const {
    editorState,
    actions,
    appController,
    currentViewportElements,
    COMPONENT_MODELS,
  } = editorController

  console.log("elements", elements)

  const elementsAdj = (
    !parentId
      ? elements?.filter((el) => !el._parentId)
      : elements?.filter((el) => el._parentId === parentId)
  )?.filter((el) => el._page === editorState.ui.selected.page)

  const rawElements = elementsAdj.map((element, eIdx) => {
    const typeFirstLetter = element._type.slice(0, 1)
    const isHtmlElement = isStringLowerCase(typeFirstLetter)

    const props = (element as any)?.schema?.properties ?? {}
    const elementIconKeys = isHtmlElement
      ? []
      : Object.keys(props)?.filter(
          (key) => props[key]?.type === PropertyType.icon
        )
    const elementArrayKeys = isHtmlElement
      ? []
      : Object.keys(props)?.filter((key) => {
          const itemsProps = (props?.[key] as any)?.items?.[0]?.properties
          return (
            props[key]?.type === PropertyType.Array &&
            Object.keys(itemsProps)?.filter?.(
              (key) => itemsProps[key]?.type === PropertyType.icon
            )
          )
        })
    const elementArrayIconInjectionDict = elementArrayKeys
      .map((key) => {
        const itemsProps = (props?.[key] as any)?.items?.[0]?.properties
        return Object.keys(itemsProps)
          ?.filter((key) => itemsProps[key]?.type === PropertyType.icon)
          ?.map((itemKey) => ({ key, itemKey }))
      })
      .flat()
      ?.reduce((acc, it) => {
        return {
          ...acc,
          [it.key]: (element as any)?.props?.[it.key]?.map?.((item: any) => ({
            ...item,
            [it.itemKey]: icons?.[item[it.itemKey]],
          })),
        }
      }, {})

    // e.g. {...., icon: mdiPencil, ... }
    const injectedIconsDict = elementIconKeys?.reduce(
      (acc, key) => ({
        ...acc,
        [key]: icons?.[(element as any)?.props?.[key]],
      }),
      {}
    )

    const baseComponent = COMPONENT_MODELS?.find(
      (com) => com.type === element?._type
    )
    const CurrentComponent =
      baseComponent &&
      'component' in baseComponent &&
      (baseComponent.component as React.ComponentType<any>)

    const elementAdj = {
      ...element,
      props: {
        ...(((element as any)?.props as any) ?? {}),
        // ...iconInjection,
        // ...endIconInjection,
        ...injectedIconsDict,

        ...elementArrayIconInjectionDict,
      },
    }

    const navValueState = (appController as any)?.state?.[element?._id] ?? {}
    const onTabChange = (tabValue: string) => {
      appController.actions.updateProperty(element?._id, tabValue)
    }

    const elementChildren =
      currentViewportElements?.filter((el) => el._parentId === element._id) ??
      []
    const tabChildren =
      element?._type === ('NavContainer' as any)
        ? (() => {
            const sourceControlElementId = (element as any)?.props
              ?.navigationElementId

            if (!sourceControlElementId) return []
            const activeTab = appController?.state?.[sourceControlElementId]
            const activeId = (element as any)?.props?.items?.find(
              (item: any) => item.value === activeTab
            )?.childId
            const activeChild = elementChildren?.find?.(
              (child) => child._id === activeId
            )
            const children = activeChild ? [activeChild] : []
            return children
          })()
        : []

    const renderedElementChildren =
      !!elementChildren?.length &&
      renderHtmlElements(
        elementChildren,
        editorController,
        onSelectElement,
        tableUis,
        theme,
        isProduction,
        icons,
        element._id,
        isPointerProduction
      )

    const TabChildren =
      !!tabChildren?.length &&
      renderHtmlElements(
        tabChildren,
        editorController,
        onSelectElement,
        tableUis,
        theme,
        isProduction,
        icons,
        element._id,
        isPointerProduction
      )

    // console.log(
    //   element._type,
    //   element,
    //   ['Tabs', 'BottomNavigation', 'ListNavigation', 'ButtonGroup'].includes(
    //     element?._type
    //   ),
    //   CurrentComponent
    // )

    const clientFilters = tableUis?.[element._id]?.filters ?? []
    const clientFiltersExSorting = clientFilters?.filter(
      (f: any) => f.filterKey !== 'sorting'
    )
    const clientFilterSorting = clientFilters?.filter(
      (f: any) => f.filterKey === 'sorting'
    )?.[0]?.value
    const [clientFilterKey, clientFilterDirection] =
      clientFilterSorting?.split?.(',') ?? []

    const clientFilteredTableData = elementAdj?.props?.data?.filter((d: any) =>
      clientFiltersExSorting?.length
        ? clientFilters.some((f: any) => f.value === d[f.filterKey])
        : true
    )
    const clientSortedFilteredTableData = clientFilterKey
      ? clientFilteredTableData?.sort?.((a: any, b: any) => {
          const sortKey = clientFilterKey
          return a?.[sortKey] > b?.[sortKey]
            ? clientFilterDirection === 'asc'
              ? 1
              : -1
            : b?.[sortKey] > a?.[sortKey]
            ? clientFilterDirection === 'asc'
              ? -1
              : 1
            : 0
        })
      : clientFilteredTableData

    const rootElementOverlayProps = {
      editorController,
      element: element,
      onSelectElement: editorController.actions.ui.selectElement,
      editorState,
      actions: editorController.actions,
      onIsHoveringChange: editorController.actions.ui.selectHoveredElement,
      isProduction,
    }

    return isHtmlElement ? (
      <ElementBox
        element={element}
        onSelectElement={onSelectElement}
        editorState={editorState}
        key={element._id}
        isProduction={isProduction || isPointerProduction}
      >
        <RootElementOverlay {...rootElementOverlayProps} />
        {renderedElementChildren}
      </ElementBox>
    ) : // components
    isComponentType(element._type) ? (
      ['Button', 'Chip', 'Typography'].includes(element?._type) &&
      CurrentComponent ? (
        <CurrentComponent
          key={element._id}
          {...((elementAdj as any)?.props ?? {})}
          rootInjection={<RootElementOverlay {...rootElementOverlayProps} />}
          sx={
            !isProduction
              ? {
                  ...((elementAdj as any)?.props?.sx ?? {}),
                  position: 'relative',
                }
              : (elementAdj as any)?.props?.sx
          }
        />
      ) : ['Table'].includes(element?._type) && CurrentComponent ? (
        <CurrentComponent
          {...((elementAdj as any)?.props ?? {})}
          data={clientSortedFilteredTableData}
          onSetFilters={(newFilters: any) => {
            actions.ui.setTableFilters(elementAdj._id, newFilters)
          }}
          filters={tableUis?.[element._id]?.filters ?? []}
          sx={
            !isProduction
              ? {
                  ...((elementAdj as any)?.props?.sx ?? {}),
                  position: 'relative',
                }
              : (elementAdj as any)?.props?.sx
          }
          rootInjection={<RootElementOverlay {...rootElementOverlayProps} />}
        />
      ) : ['Form'].includes(element?._type) && CurrentComponent ? (
        <CurrentComponent
          {...((elementAdj as any)?.props ?? {})}
          formData={appController.actions.getFormData(elementAdj._id)}
          onChangeFormData={(
            newFormData: any,
            propertyKey: string,
            propertyValue: any,
            prevFormData: any
          ) => {
            appController.actions.changeFormData(elementAdj._id, newFormData)
          }}
          sx={
            !isProduction
              ? {
                  ...((elementAdj as any)?.props?.sx ?? {}),
                  position: 'relative',
                }
              : (elementAdj as any)?.props?.sx
          }
          rootInjection={<RootElementOverlay {...rootElementOverlayProps} />}
        />
      ) : //  NAVIGATION ELEMENTS (slightly different interface)
      ['Tabs', 'BottomNavigation', 'ListNavigation', 'ButtonGroup'].includes(
          element?._type
        ) && CurrentComponent ? (
        <CurrentComponent
          {...((elementAdj as any)?.props ?? {})} // icon injections needed ? -> more generic approach
          onChange={onTabChange}
          value={navValueState}
          sx={
            !isProduction
              ? {
                  ...((elementAdj as any)?.props?.sx ?? {}),
                  position: 'relative',
                }
              : (elementAdj as any)?.props?.sx
          }
          rootInjection={<RootElementOverlay {...rootElementOverlayProps} />}
        >
          {renderedElementChildren}
        </CurrentComponent>
      ) : element?._type === 'AppBar' ? (
        <AppBar
          {...((element?.props as any) ?? {})}
          sx={
            (element?.props?.position === 'fixed' ||
              !element?.props?.position) &&
            !isProduction
              ? {
                  ...((elementAdj as any)?.props?.sx ?? {}),
                  top: 42,
                  left: editorState.ui.previewMode ? 0 : 364,
                  width: editorState.ui.previewMode
                    ? '100%'
                    : 'calc(100% - 364px - 350px)',
                }
              : { ...((elementAdj as any)?.props?.sx ?? {}) }
          }
          onChange={onTabChange}
          value={navValueState}
        >
          {renderedElementChildren}
          <RootElementOverlay {...rootElementOverlayProps} />
        </AppBar>
      ) : element?._type === 'Paper' ? (
        <Paper
          {...((element?.props as any) ?? {})}
          sx={
            !isProduction
              ? {
                  ...((elementAdj as any)?.props?.sx ?? {}),
                  position: 'relative',
                }
              : (elementAdj as any)?.props?.sx
          }
          onChange={onTabChange}
          value={navValueState}
        >
          {renderedElementChildren}
          <RootElementOverlay {...rootElementOverlayProps} />
        </Paper>
      ) : // Navigation Container -> specific render case (but could be component, too)
      element?._type === 'NavContainer' ? (
        (() => {
          const { children, ...childLessProps } = element?.props ?? {}
          return <Box {...(childLessProps ?? {})}>{TabChildren}</Box>
        })()
      ) : null
    ) : null
  })
  return rawElements
}
