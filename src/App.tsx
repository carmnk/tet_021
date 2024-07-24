import { useMemo } from 'react'
import { HtmlRenderer } from './_renderer/renderer/HtmlRenderer'
import { useEditorController } from './_renderer/editorController/editorController'
import appData from './app_data.json'
import { BrowserRouter } from 'react-router-dom'
import { transformEditorStateFromPayload } from './_renderer/apiController/transformEditorDbState'
import { baseComponents } from './_renderer/editorComponents/baseComponents'
import { defaultEditorState } from './_renderer/editorController/editorState'

console.log('appData', appData)

function App() {
  const appDataAdj = useMemo(() => {
    const transformedState = transformEditorStateFromPayload(
      appData as any,
      defaultEditorState(),
      baseComponents
    )
    console.log('TRANSFORM', appData, transformedState)

    // adjust images -> images are currently supposed to be in the json - imageFiles.[n].image
    //CLOUD SOLutioN BACK !!!
    const adjImages = transformedState.assets.images.map((img) => ({
      ...img,
      image:
        appData.imageFiles.find((file) => file.asset_id === img._id)?.image ||
        null,
    }))
    return {
      ...transformedState,
      elements: transformedState.elements.map((el) =>
        el._type === 'img' && el.attributes?.src
          ? {
              ...el,
              attributes: {
                ...el.attributes,
                src:
                  adjImages.find((adjImg) => adjImg._id === el?.attributes?.src)
                    ?.image || null,
              },
            }
          : el
      ),
      assets: {
        ...transformedState.assets,
        images: adjImages,
      },
    }
  }, [])

  const editorController = useEditorController({
    initialEditorState: appDataAdj as any,
    // injections: {
    //   components: [...baseComponents, buttonEditorComponentDef],
    // },
  })
  const theme = editorController.editorState.theme

  console.log('appData Adjusted ', appDataAdj)
  return (
    <>
      <BrowserRouter>
        <HtmlRenderer
          editorController={editorController}
          theme={theme}
          isProduction
        ></HtmlRenderer>
      </BrowserRouter>
    </>
  )
}

export default App
