import { ElementType } from '../editorController/editorState'
import { StyledTreeItemProps } from '../treeview/CTreeItem'
import { v4 as uuid } from 'uuid'
import { isComponentType } from './utils'
import { mdiCodeBlockTags, mdiReact } from '@mdi/js'
import Icon from '@mdi/react'

export const mapHtmlElementsToTreeItems = (
  elements: ElementType[],
  allElements: ElementType[],
  isDraggable: boolean,
  components: any[],
  rootElements?: ElementType[],
  parentNavContainerId?: string
): StyledTreeItemProps[] => {
  const treeItems = elements.map((element, eIdx) => {
    const id = element?._id ?? uuid()

    const parentNavContainer = parentNavContainerId
      ? allElements?.find((el) => el._id === parentNavContainerId)
      : null
    const parentNavContainerItems =
      (parentNavContainer as any)?.props?.items ?? []
    const caseName = parentNavContainerItems?.find(
      (item: any) => item.childId === id
    )?.value

    const children = allElements?.filter((el) => el._parentId === id)
    return {
      _parentId: element._parentId,
      key: id,
      type: element._type,
      parentNavContainerId,
      nodeId: id,
      element,
      labelIcon: (
        <Icon
          path={
            isComponentType(element._type)
              ? components?.find((com) => com.type === element?._type)?.icon ??
                mdiReact
              : mdiCodeBlockTags
          }
          size={1}
        />
      ),
      labelText:
        (parentNavContainerId ? (caseName ? '↦' + caseName + ':' : '⚠:') : '') +
        (element._type +
          ((element as any).attributes?.id ?? element?._userID
            ? `#${(element as any).attributes?.id ?? element?._userID}`
            : '')),
      children: children?.length
        ? mapHtmlElementsToTreeItems(
            children,
            allElements,
            isDraggable,
            components,
            rootElements ?? elements,
            (element?._type === ('NavContainer' as any) ? id : undefined) as any
          )
        : [],
      useDraggable: isDraggable,
    } as StyledTreeItemProps
  }) as StyledTreeItemProps[]
  return treeItems as any
}
