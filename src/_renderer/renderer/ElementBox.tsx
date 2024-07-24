import {
  CSSProperties,
  HTMLProps,
  PropsWithChildren,
  MouseEvent,
  useMemo,
} from 'react'
import { ElementType } from '../editorController/editorState'
import { Box, useTheme } from '@mui/material'
import { useElementHover } from '../hooks/useElementHover'
import { EditorStateType } from '../editorController/editorState'
import { getStylesFromClasses } from './getStylesFromClasses'
import { useNavigate } from 'react-router-dom'

export type ElementBoxProps = {
  element: ElementType
  editorState: EditorStateType
  onSelectElement: (element: ElementType, isHovering: boolean) => void
  isProduction?: boolean
  isPointerProduction?: boolean
}

const sx = {
  position: 'relative',
}

export const ElementBox = (props: PropsWithChildren<ElementBoxProps>) => {
  const {
    element,
    children,
    onSelectElement,
    editorState,
    isProduction,
    isPointerProduction,
  } = props
  const theme = useTheme()
  const navigate = useNavigate()

  const { callbackRef: ref } = useElementHover({
    disabled: true, //isProduction || isPointerProduction,
  })
  const isHovering = false

  const className =
    'attributes' in element ? element?.attributes?.className : undefined
  const stylesFromClasses = getStylesFromClasses(
    className ?? '',
    editorState?.cssSelectors
  )

  const styles = useMemo(() => {
    // const additionalHoverStyles =
    //   !(isProduction || isPointerProduction) &&
    //   (isHovering || editorState?.ui.selected.element === element._id)
    //     ? {
    //         border:
    //           '1px ' +
    //           (editorState?.ui.selected.element === element._id
    //             ? 'solid '
    //             : 'dashed ') +
    //           theme.palette.primary.main,
    //         borderRadius: '1px',
    //         '& >div:first-of-type': {
    //           display: 'block',
    //         },
    //         //   width: "calc(100% - 2px)",
    //       }
    //     : {}
    const linkHoverStyles =
      element._type === 'a' && (element as any)?.attributes?.href
        ? { cursor: 'pointer' }
        : {}

    const styleAttributes =
      'attributes' in element ? element?.attributes?.style ?? {} : {}

    const aggregatedUserStyles = {
      ...stylesFromClasses,
      ...styleAttributes,
    }
    const userOverridesEditorHoverStyles: CSSProperties = {}
    if ('borderWidth' in aggregatedUserStyles) {
      userOverridesEditorHoverStyles.borderWidth =
        aggregatedUserStyles.borderWidth + ' !important'
    }
    if ('borderStyle' in aggregatedUserStyles) {
      userOverridesEditorHoverStyles.borderStyle =
        aggregatedUserStyles.borderStyle + ' !important'
    }
    if ('borderColor' in aggregatedUserStyles) {
      userOverridesEditorHoverStyles.borderColor =
        aggregatedUserStyles.borderColor + ' !important'
    }
    if ('borderRadius' in aggregatedUserStyles) {
      userOverridesEditorHoverStyles.borderRadius =
        aggregatedUserStyles.borderRadius + ' !important'
    }

    // interesting: top=0 -> not default -> inject only if top:0, left:0 is set !! Otherwise the position is as static
    const isPositionFixed =
      !isProduction && aggregatedUserStyles?.position === 'fixed'
    const compensateX =
      isPositionFixed &&
      editorState.ui.previewMode &&
      !aggregatedUserStyles.left
        ? -364
        : isPositionFixed &&
          !editorState.ui.previewMode &&
          aggregatedUserStyles.left
        ? 364
        : 0
    const compensateY = isPositionFixed && aggregatedUserStyles.top ? 42 : 0

    //isPositionFixed && editorState.ui.previewMode && aggregatedUserStyles.top ? -42 : 0
    const compensateFixedStylesInEditor = isPositionFixed
      ? { transform: `translate(${compensateX}px, ${compensateY}px)` }
      : {}

    return {
      ...sx,
      ...linkHoverStyles,
      ...stylesFromClasses,
      ...styleAttributes,

      // ...additionalHoverStyles,
      ...userOverridesEditorHoverStyles,
      ...compensateFixedStylesInEditor,

      //   backgroundColor: "rgba(0,150,136,0.1)",
    } as CSSProperties
  }, [
    // isHovering,
    // editorState.ui.selected.element,
    // theme,
    stylesFromClasses,
    isProduction,
    // isPointerProduction,
    element,
    editorState.ui.previewMode,
  ])

  // useEffect(() => {
  //   onSelectElement(element, isHovering);
  // }, [isHovering, element, onSelectElement]);

  const isOverheadHtmlElement = ['html', 'head', 'body'].includes(element._type)
  const elementAttributs =
    'attributes' in element
      ? (element?.attributes as HTMLProps<HTMLLinkElement> & {
          href: string
        })
      : ({} as HTMLProps<HTMLLinkElement>)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { style, href, ...styleLessAttributes } = elementAttributs ?? {}

  const boxProps = useMemo(
    () => ({
      // id: isOverheadHtmlElement ? element.type + "_" + element?.id : element.id,
      component: isOverheadHtmlElement
        ? ('div' as const)
        : (element._type as any),
      key: element._id,
      ...(styleLessAttributes ?? {}),
      sx: styles,
    }),
    [element, isOverheadHtmlElement, styles, styleLessAttributes]
  )

  const linkProps = useMemo(() => {
    if (element._type === 'a') {
      return {
        onClick: (e: MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          // console.log('element onclick', element)
          e.preventDefault()
          const attributes =
            element.attributes as HTMLProps<HTMLLinkElement> & {
              href: string
            }

          const isExternalLink = !attributes?.href?.startsWith('/')
          // console.log('attributes', attributes, isExternalLink)
          if (isExternalLink) {
            window.open(attributes?.href, '_blank')
          } else {
            // const
            const href = attributes?.href === '/index' ? '/' : attributes?.href
            navigate(href ?? '')
          }
        },
      }
    }
    return {}
  }, [element, navigate])

  const uiEditorHandlers = useMemo(() => {
    return isProduction || isPointerProduction
      ? {}
      : {
          onClick: (e: MouseEvent<HTMLDivElement, MouseEvent>) => {
            e.stopPropagation()
            onSelectElement(element, isHovering)
          },
        }
  }, [onSelectElement, element, isHovering, isProduction, isPointerProduction])

  return ['br', 'hr', 'img'].includes(element?._type) ? (
    <Box {...boxProps} {...linkProps} ref={ref} />
  ) : (
    <Box
      {...linkProps}
      {...boxProps}
      // {...uiEditorHandlers}
      ref={ref}
    >
      {/* label */}
      {!(isProduction || isPointerProduction) &&
        ((
          <Box
            // onMouseOver={() => {}}
            // onMouseOut={() => {}}
            sx={{
              display: 'none',
              position: 'absolute',
              top: 0,
              right: 0,
              border: '1px solid rgba(0,150,136,0.5)',
              borderRadius: '1px',
              color: 'text.primary',
            }}
          >
            {element._type}
          </Box>
        ) as any)}

      {('_content' in element ? element?._content : children) || children}
    </Box>
  )
}
