import { EditorStateType } from '../editorController/editorState'

export const getStylesFromClasses = (
  selectorId: string,
  cssSelectors: EditorStateType['cssSelectors']
): React.CSSProperties => {
  const className = (cssSelectors.find((sel) => sel._id === selectorId) as any)
    ?._userId

  const classNames = className?.trim?.()?.split?.(' ') || []
  const cssSelector = cssSelectors?.find(
    (selector) => classNames.includes((selector as any)._userId) // or _id?!
  )

  const classStyles = cssSelector ?? {}

  // const stylesFromClasses = classStyles?.reduce?.((acc, curr) => {
  //   return {
  //     ...acc,
  //     ...curr,
  //   };
  // }, {});
  return classStyles
}
