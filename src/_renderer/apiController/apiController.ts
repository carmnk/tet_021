import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { EditorStateType, ImageType } from '../editorController/editorState'
import { API } from './API'
import { transformEditorStateToPayload } from './transformEditorState'
import { createMuiTheme } from '../createTheme'
import { EditorControllerAppStateReturnType } from '../editorController/editorControllerTypes'
import { useSearchParams } from 'react-router-dom'
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { EntityPayloadType } from '../EntityModel/entities'
import { EntityFieldPayloadType } from '../EntityModel/entitiy_fields'
import { EntityValuePayloadType } from '../EntityModel/entity_values'
import { EntityListPayloadType } from '../EntityModel/entity_lists'
import { EntityListFieldPayloadType } from '../EntityModel/entity_list_fields'
import { EntityModelType } from '../EntityModel/entityDataModel'
import { EntityJoiningPayloadType } from '../EntityModel/entity_joinings'
import { EditorStateDbDataType } from './types'
import { transformEditorStateFromPayload } from './transformEditorDbState'
import { isEqual } from 'lodash'
import { getDeviatingKeys, makeComparableEditorState } from './utils'

export const SESSION_DURATION = 10 * 60 * 1000 // 10 minutes

export type ServerControllerActionsType = {
  login: () => void
  logout: () => void
  handleRequestWebsiteZipBundle: () => void
  saveProjectToCloud: (
    payload: EditorStateType
  ) => Promise<EditorStateType | null>
  getLoggedInStatus: () => { expires: string | null; email: string | null }
  changeLoginEmail: (email: string) => void
  changeLoginPassword: (password: string) => void
  loadProjectFromCload: (project_id: string) => Promise<void>
  cloneProjectFromCload: (project_id: string) => Promise<void>
  changeLogInStatus: (isLoggedIn: boolean) => void
  deleteProjectFromCloud: (project_id: string) => Promise<void>
  updateUserData: (user: GithubUserType) => void
  updateUserRepos: (repos: any[]) => void
  setLoading: (loading: boolean) => void
  //
  updateDataModel: () => void
  createEntity: (payload: EntityPayloadType) => void
  editEntity: (payload: EntityPayloadType) => void
  deleteEntity: (entity_id: number) => void

  createEntityField: (payload: EntityFieldPayloadType) => void
  editEntityField: (payload: EntityFieldPayloadType) => void
  deleteEntityField: (entity_field_id: number) => void
  createEntityValue: (payload: EntityValuePayloadType) => void
  editEntityValue: (payload: EntityValuePayloadType) => void
  deleteEntityValue: (entity_values_id: number) => void

  createEntityList: (payload: EntityListPayloadType) => void
  editEntityList: (payload: EntityListPayloadType) => void
  deleteEntityList: (entity_list_id: number) => void

  createEntityListField: (payload: EntityListFieldPayloadType) => void
  editEntityListField: (payload: EntityListFieldPayloadType) => void
  deleteEntityListField: (entity_list_field_id: number) => void

  deleteEntityJoining: (entity_joining_id: number) => void
  editEntityJoining: (payload: EntityJoiningPayloadType) => void
  createEntityJoining: (payload: EntityJoiningPayloadType) => void

  saveGithubRepo: () => Promise<void>
  refreshUserRepos: () => Promise<void>

  createGithubPages: () => Promise<void>
  deleteGithubPages: () => Promise<void>
}
export type GithubUserType = {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string // ?
  url: string
  html_url: string
  followers_url: string
  type: string
  site_admin: boolean
  name: string | null
  company: string | null
  location: string | null
  email: string | null
  created_at: string // Date ?
  updated_at: string
}

export type ServerControllerType = {
  data: {
    bundleData: {
      loading: boolean
      link: string
      blob: Blob | null
    }
    loginForm: {
      email: string
      password: string
      isLoggedIn?: boolean // ?
    }
    user: GithubUserType | null
    repos: any[]
    loading: boolean
    entityModel: EntityModelType
  }
  actions: ServerControllerActionsType
}

export const useServerController = (
  editorState: EditorStateType,
  setEditorState: Dispatch<SetStateAction<EditorStateType>>,
  appController: EditorControllerAppStateReturnType,
  components: any[]
): ServerControllerType => {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamCode = searchParams?.get('code')

  const [data, setData] = useState<ServerControllerType['data']>({
    bundleData: {
      loading: false,
      link: '',
      blob: null as Blob | null,
    },
    loginForm: {
      email: 'cm@cm.mt',
      password: 'password',
      isLoggedIn: false,
    },
    loading: false,
    user: null as GithubUserType | null,
    repos: [] as any[],
    entityModel: {
      _entities: [],
      _entity_fields: [],
      _entity_values: [],
      _entity_lists: [],
      _entity_list_fields: [],
      _entity_joinings: [],
    },
  })

  const [compare, setCompare] = useState<EditorStateType | null>(null)

  const changeLogInStatus = useCallback(
    (isLoggedIn: boolean) => {
      localStorage.removeItem('expires')
      localStorage.removeItem('email')
      setData((current) => ({
        ...current,
        loginForm: {
          ...current.loginForm,
          isLoggedIn,
        },
      }))
    },
    [setData]
  )

  const changeLoginEmail = useCallback((email: string) => {
    setData((current) => ({
      ...current,
      loginForm: {
        ...current.loginForm,
        email,
      },
    }))
  }, [])

  const changeLoginPassword = useCallback((password: string) => {
    setData((current) => ({
      ...current,
      loginForm: {
        ...current.loginForm,
        password,
      },
    }))
  }, [])

  const login = useCallback(async () => {
    try {
      const email = data.loginForm.email
      const password = data.loginForm.password
      const expiresAt = +new Date() + SESSION_DURATION
      try {
        const res = await API.login.query({ email, password })
        localStorage.setItem('expiresAt', expiresAt.toString())
        localStorage.setItem('email', email)
        setData((current) => ({
          ...current,
          loginForm: {
            ...current.loginForm,
            isLoggedIn: true,
          },
        }))
      } catch (e) {
        console.error(e)
      }

      // updateRoutes()
      // navigate?.(INITIAL_ROUTE)
    } catch (err) {
      // showToast(TOASTS.general.genericError)
      console.log(err)
    }
  }, [data.loginForm.email, data.loginForm.password])

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('expiresAt')
      localStorage.removeItem('email')
      try {
        const res = await API.logout.query()
      } catch (e) {
        console.error(e)
      }

      setData((current) => ({
        ...current,
        loginForm: {
          ...current.loginForm,
          isLoggedIn: false,
        },
      }))
      // updateRoutes()
      // navigate?.(INITIAL_ROUTE)
    } catch (err) {
      // showToast(TOASTS.general.genericError)
      console.error(err)
    }
  }, [])

  const handleRequestWebsiteZipBundle = useCallback(async () => {
    setData((current) => ({
      ...current,
      bundleData: {
        ...current.bundleData,
        loading: true,
      },
    }))
    try {
      const res = await API.exportProjectToZip(
        editorState.project.project_id
      ).query()
      console.log('CREATE_BUNDLE- RESPONSE', res)
      //   const baseUrl = import.meta.env.VITE_WEBSITE_BUILDER_SERVER
      //   const url = baseUrl + '/fe_gen/zip_export'
      //   /* eslint-disable @typescript-eslint/no-unused-vars */
      //   const {
      //     // selectedCssClass,
      //     // selectedHtmlElementName,
      //     // selectedImage,
      //     // selectedFont
      //     // selectedPage,
      //     // expandedTreeItems,
      //     // imageWorkspaces,
      //     // htmlPages: htmlPagesIn, // !!! ???
      //     // cssWorkspaces,
      //     ui,
      //     ...dataRaw
      //   } = editorState
      //   /* eslint-enable @typescript-eslint/no-unused-vars */
      //   const htmlPages = makeImageSourcesForExport(editorState)
      //   const formData = new FormData()
      //   formData.append('cssWorkspaces', JSON.stringify(cssWorkspaces))
      //   formData.append('htmlPages', JSON.stringify(htmlPages))
      //   for (let f = 0; f < Object.keys(imageWorkspaces.common).length; f++) {
      //     const key = Object.keys(imageWorkspaces.common)[f]
      //     const image = imageWorkspaces.common[key]
      //     formData.append('image', image.image as unknown as File)
      //   }
      //   const res = await axios.post(url, formData, {
      //     responseType: 'blob',
      //     headers: {
      //       'Content-Type': 'multipart/form-data',
      //     },
      //   })
      //   const link = getLinkFromDownloadResponse(res)
      //   openDownloadWithLink(link)
    } catch (e) {
      console.error('error', e)
      alert('an error occurred while downloading the file')
    }
    setData((current) => ({
      ...current,
      bundleData: {
        ...current.bundleData,
        loading: false,
      },
    }))
  }, [editorState])

  // internal Fn to process server response
  const loadProjectFromServerResponse = useCallback(
    async (
      serverResponse: EditorStateDbDataType,
      template_owner_user_id?: number
    ): Promise<EditorStateType> => {
      const newEditorState = transformEditorStateFromPayload(
        serverResponse,
        editorState,
        components
      )

      const currentEditorImageIds = editorState?.assets.images.map(
        (image) => image._id
      )
      const imageIdsFromDb = newEditorState?.assets.images?.map(
        (image) => image._id
      )
      const missingImageIds = imageIdsFromDb?.filter(
        (imageId) => !currentEditorImageIds?.includes(imageId)
      )

      const imageFiles: {
        url: string
        image: File
        _id: string
        src: string
      }[] = []
      for (let i = 0; i < missingImageIds?.length; i++) {
        const imageId = missingImageIds[i]
        try {
          const res = template_owner_user_id
            ? await API.getSharedAsset(template_owner_user_id, imageId).query()
            : await API.getAsset(imageId).query()
          const blob = res?.data
          const url = URL.createObjectURL(blob)
          const file = new File([blob], imageId, {
            type: blob.type,
          })

          imageFiles.push({ url, image: file, _id: imageId, src: url })
        } catch (err) {
          console.error(err)
        }
      }

      const newThemes = newEditorState?.themes?.map((theme) => {
        const muiTheme = createMuiTheme(theme)
        // const palette = theme.palette
        // const paletteMainKeys = Object.keys(palette)
        // const newPalette = paletteMainKeys.reduce((acc, key) => {
        //   const mainColor = palette[key as keyof typeof palette]
        //   const mainColorSubColorNames = Object.keys(mainColor)
        //   const subColorNames = mainColorSubColorNames.filter(
        //     (colorName) => (mainColor as any)[colorName]
        //   )
        //   const subColors = subColorNames.reduce((acc, subColorName) => {
        //     const value = (mainColor as any)[subColorName]
        //     return {
        //       ...acc,
        //       [subColorName]: value,
        //     }
        //   }, {})
        //   const newValue = typeof mainColor === 'object' ? subColors : mainColor
        //   return {
        //     ...acc,
        //     [key]: newValue,
        //   }
        // }, {})
        // const cleanedTheme = {
        //   ...theme,
        //   palette: newPalette,
        // }

        return muiTheme
      })

      const newAssets = {
        ...newEditorState.assets,
        images: (newEditorState.assets.images
          ? newEditorState.assets.images?.map((image) => {
              const imageFile = imageFiles.find(
                (imageFile) => imageFile._id === image._id
              )
              return {
                ...image,
                ...((imageFile || {}) as any),
              }
            }) ?? []
          : editorState?.assets.images) as ImageType[],
        // ...imageFiles.map((imageFile) => ({
        //   _id: imageFile.url,
        //   image: imageFile.url,
        // })),
      }
      const elementsWithNewImages = newEditorState.elements.map(
        (el) => {
          // const srcAttribute =
          return el?._type === 'img'
            ? {
                ...el,
                attributes: {
                  ...el.attributes,
                  src:
                    (
                      newAssets.images.find(
                        (as) => as._id === el?.attributes?.src
                      ) || {}
                    )?.src || el?.attributes?.src,
                },
              }
            : el
        }

        // src: (newAssets.images.find((as) => as._id === el. )) } : el}
        // : el
      )

      elementsWithNewImages.forEach((el) => {
        const defaultComponentProps = components.find(
          (comp) => comp.type === el._type
        )
        if (!defaultComponentProps) return
        if ('state' in defaultComponentProps) {
          const _id = el._id
          appController.actions.addProperty(
            _id,
            (defaultComponentProps as any)?.state ?? ''
          )
        }
      })

      const defaultTheme = serverResponse?.project?.default_theme as any
      const newEditorStateWithImages = {
        ...newEditorState,
        elements: elementsWithNewImages,
        assets: newAssets,
        themes: newThemes,
        theme: newThemes?.find(
          (theme) => theme.palette.mode === defaultTheme
        ) as any,
      }
      console.log(
        'LOAD_PROJECT- data in,',
        serverResponse,
        newEditorState,
        newEditorStateWithImages
      )
      if (serverResponse?.project) setEditorState(newEditorStateWithImages)

      return newEditorStateWithImages
    },
    [editorState, setEditorState, appController.actions]
  )

  const loadProjectFromCload = useCallback(
    async (project_id: string) => {
      if (!project_id) return
      try {
        const res = await API.loadProject(project_id).query()
        const resDataIn = res?.data?.data
        const newEditorState = await loadProjectFromServerResponse(resDataIn)
      } catch (err) {
        console.error(err)
      }
    },
    [loadProjectFromServerResponse]
  )
  const cloneProjectFromCload = useCallback(
    async (project_id: string) => {
      if (!project_id) return
      try {
        const res = await API.cloneProject(project_id).query()
        const resDataIn = res?.data?.data
        const template_owner_user_id =
          resDataIn?.project?.template_owner_user_id
        const newEditorState = await loadProjectFromServerResponse(
          resDataIn,
          template_owner_user_id
        )
        const images: (EditorStateType['assets']['images'][number] & {
          _old_asset_id: string
        })[] = newEditorState?.assets?.images?.map((image) => ({
          ...image,
          _id: uuidv4(),
          _old_asset_id: image._id,
          _upload: true,
        }))
        const elements = newEditorState?.elements?.map((el) =>
          el?._imageSrcId
            ? {
                ...el,
                _imageSrcId: images.find(
                  (img) => img._old_asset_id === el._imageSrcId
                )?._id,
              }
            : el
        )
        const newEditorStateAdjAssets: EditorStateType = {
          ...newEditorState,
          assets: { ...newEditorState.assets, images },
          elements,
        }
        setEditorState(newEditorStateAdjAssets)
      } catch (err) {
        console.error(err)
      }
    },
    [loadProjectFromServerResponse, setEditorState]
  )

  const deleteProjectFromCloud = useCallback(async (project_id: string) => {
    if (!project_id) return
    try {
      const res = await API.deleteProject(project_id).query()
    } catch (err) {
      console.error(err)
    }
  }, [])

  const saveProjectToCloud = useCallback(
    async (payload: EditorStateType): Promise<EditorStateType | null> => {
      const compareEditorStateBeforeSave = makeComparableEditorState(payload)
      const payloadDbDataRaw = transformEditorStateToPayload(payload)
      if (!payloadDbDataRaw) {
        return null
      }
      console.log(
        'SAVE_PROJECT- BEFORE SAVE, payload: ',
        payloadDbDataRaw,
        'pre-processed payload: ',
        payload
      )
      // return
      const payloadDbData = new FormData()
      const { imageFiles, ...payloadJsonData } = payloadDbDataRaw
      payloadDbData.append('data', JSON.stringify(payloadJsonData))
      for (let f = 0; f < (imageFiles?.length ?? 0); f++) {
        const imageFile = imageFiles?.[f]
        if (!imageFile) continue
        const file = imageFile?.image as File
        const newFile = new File([file], imageFile.asset_id, {
          type: file.type,
        })

        payloadDbData.append('image', newFile)
      }

      try {
        const res = await API.saveProject.query(
          payloadDbData,
          undefined,
          undefined,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        const resDataIn = res?.data?.data?.data
        const newEditorState = await loadProjectFromServerResponse(resDataIn)
        // const newEditorState = transformEditorStateFromPayload(
        //   resDataIn,
        //   editorState
        // )
        // setEditorState(newEditorcState)
        console.log(
          'SAVE_PROJECT- After Save, data in:',
          resDataIn,
          'new state',
          newEditorState
        )

        const adjNewEditorState = makeComparableEditorState(newEditorState)

        const deviatingKeys = getDeviatingKeys(
          compareEditorStateBeforeSave,
          adjNewEditorState
        )
        const deviatingKeys2 = getDeviatingKeys(
          compareEditorStateBeforeSave.elements[1],
          adjNewEditorState.elements[1]
        )
        console.log(
          'COMPARE before vs after save',
          compareEditorStateBeforeSave,
          adjNewEditorState,
          isEqual(compareEditorStateBeforeSave, adjNewEditorState),
          deviatingKeys,
          deviatingKeys.map((key) =>
            getDeviatingKeys(
              compareEditorStateBeforeSave?.[key],
              adjNewEditorState?.[key]
            )
          ),
          deviatingKeys2
        )
        setEditorState(newEditorState)
        return newEditorState
      } catch (err) {
        console.error(err)
        return null
      }
    },
    [loadProjectFromServerResponse, setEditorState]
  )

  const saveGithubRepo = useCallback(async () => {
    try {
      const res = await API.saveGithubRepo.query({
        project_id: editorState.project.project_id as any,
      })

      console.log('SAVE_GITHUB_REPO', res)
    } catch (e) {
      console.error(e)
    }
  }, [editorState.project.project_id])

  const updateUserData = useCallback((user: GithubUserType) => {
    setData((current) => {
      return { ...current, user }
    })
  }, [])
  const updateUserRepos = useCallback((repos: any[]) => {
    setData((current) => {
      return { ...current, repos }
    })
  }, [])
  const refreshUserRepos = useCallback(async () => {
    try {
      const resRepos = await API.getGithubUserRepos.query()
      const reposSorted = resRepos?.data?.data?.sort((a: any, b: any) => {
        return moment(a.updated_at).isSameOrBefore(moment(b.updated_at))
      })
      updateUserRepos(reposSorted)
    } catch (e) {
      console.error(e)
    }
  }, [updateUserRepos])

  const getLoggedInStatus = useCallback(() => {
    const expires = localStorage.getItem('expires')
    const email = localStorage.getItem('email')
    return { expires, email }
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setData((current) => {
      return { ...current, loading }
    })
  }, [])

  useEffect(() => {
    if (!searchParamCode) return
    const verifyGithubLogin = async () => {
      try {
        const resVerify = await API.verifyGithubLogin.query({
          code: searchParamCode,
        })
        console.log(resVerify)
        const userData = resVerify.data.data.data
        updateUserData(userData)
        const email = userData.login
        // remove code from url -> cannot be reused
        const expiresAt = +new Date() + SESSION_DURATION

        localStorage.setItem('expiresAt', expiresAt.toString())
        localStorage.setItem('email', email)
        localStorage.setItem('userData', JSON.stringify(userData))
        setSearchParams({})

        // console.log('VERIFY GITHUB LOGIN', resVerify)
        const resRepos = await API.getGithubUserRepos.query()
        const reposSorted = resRepos?.data?.data?.sort((a: any, b: any) => {
          return moment(a.updated_at).isSameOrBefore(moment(b.updated_at))
        })
        localStorage.setItem('userRepos', JSON.stringify(reposSorted))
        updateUserRepos(reposSorted)

        console.log('GITHUB REPOS', reposSorted)
      } catch (e) {
        console.log('ERROR VERIFYING GITHUB LOGIN', e)
        setSearchParams({})
      }
    }
    verifyGithubLogin()
  }, [searchParamCode, setSearchParams, updateUserData, updateUserRepos])

  const updateDataModel = useCallback(async () => {
    try {
      const res = await API.getEntityModel.query()
      const entityModel = res?.data
      console.log('ENTITY MODEL IN ?????????', entityModel)
      setData((current) => {
        return { ...current, entityModel }
      })
    } catch (e) {
      console.log('ERROR GETTING ENTITY MODEL', e)
    }
  }, [])

  const createEntity = useCallback(
    async (payload: EntityPayloadType) => {
      try {
        const res = await API.createEntity.query(payload)
        await updateDataModel()
        console.log('CREATE_ENTITY', res)
      } catch (e) {
        console.log('ERROR CREATE_ENTITY', e)
      }
    },
    [updateDataModel]
  )
  const editEntity = useCallback(
    async (payload: EntityPayloadType) => {
      try {
        const entity_id = payload?.entity_id
        if (!entity_id) return
        const res = await API.editEntity(entity_id).query(payload)
        updateDataModel()
        console.log('EDIT_ENTITY', res)
      } catch (e) {
        console.log('ERROR CREATE_ENTITY', e)
      }
    },
    [updateDataModel]
  )

  const deleteEntity = useCallback(
    async (entity_id: number) => {
      try {
        const res = await API.deleteEntity(entity_id).query()
        await updateDataModel()
      } catch (e) {
        console.error(e)
      }
    },
    [updateDataModel]
  )

  const createEntityField = useCallback(
    async (payload: EntityFieldPayloadType & { entity?: any }) => {
      try {
        console.log('PL', payload)
        const entity_id = editorState.ui.selected.entity as any
        if (!payload || !entity_id) return
        const { entity_field_id: _eOut, entity, ...payloadCleaned } = payload
        const payloadEnriched = {
          ...payloadCleaned,
          entity_id,
        }
        const res = await API.createEntityField.query(payloadEnriched as any)
        await updateDataModel()
        console.log('CREATE_ENTITY', res)
      } catch (e) {
        console.log('ERROR CREATE_ENTITY', e)
      }
    },
    [updateDataModel, editorState.ui.selected.entity]
  )
  const editEntityField = useCallback(
    async (payload: EntityFieldPayloadType) => {
      try {
        const entity_field_id = payload?.entity_field_id
        if (!entity_field_id) return
        const res = await API.editEntityField(entity_field_id).query(payload)
        updateDataModel()
        console.log('EDIT_ENTITY', res)
      } catch (e) {
        console.log('ERROR CREATE_ENTITY', e)
      }
    },
    [updateDataModel]
  )

  const deleteEntityField = useCallback(
    async (entity_field_id: number) => {
      try {
        const res = await API.deleteEntityField(entity_field_id).query()
        await updateDataModel()
      } catch (e) {
        console.error(e)
      }
    },
    [updateDataModel]
  )

  const createEntityValue = useCallback(
    async (payload: EntityValuePayloadType) => {
      try {
        const res = await API.createEntityValue.query(payload)
        await updateDataModel()
        console.log('CREATE_ENTITY_VALUE', res)
      } catch (e) {
        console.log('ERROR CREATE_ENTITY_VALUE', e)
      }
    },
    []
  )
  const editEntityValue = useCallback(
    async (payload: EntityValuePayloadType) => {
      try {
        const entity_values_id = payload?.entity_values_id
        if (!entity_values_id) return
        const res = await API.editEntityValue(entity_values_id).query(payload)
        await updateDataModel()
      } catch (e) {
        console.log('ERROR EDIT_ENTITY_VALUE', e)
      }
    },
    []
  )
  const deleteEntityValue = useCallback(
    async (entity_values_id: number) => {
      try {
        const res = await API.deleteEntityValue(entity_values_id).query()
        await updateDataModel()
      } catch (e) {
        console.error(e)
      }
    },
    [updateDataModel]
  )

  const createEntityList = useCallback(
    async (payload: EntityListPayloadType) => {
      try {
        const res = await API.createEntityList.query(payload)
        await updateDataModel()
        console.log('CREATE_ENTITY_VALUE', res)
      } catch (e) {
        console.log('ERROR CREATE_ENTITY_VALUE', e)
      }
    },
    [updateDataModel]
  )
  const editEntityList = useCallback(async (payload: EntityListPayloadType) => {
    try {
      const entity_list_id = payload?.entity_list_id
      if (!entity_list_id) return
      const res = await API.editEntityList(entity_list_id).query(payload)
      await updateDataModel()
    } catch (e) {
      console.log('ERROR EDIT_ENTITY_VALUE', e)
    }
  }, [])
  const deleteEntityList = useCallback(
    async (entity_list_id: number) => {
      try {
        const res = await API.deleteEntityList(entity_list_id).query()
        await updateDataModel()
      } catch (e) {
        console.error(e)
      }
    },
    [updateDataModel]
  )

  const createEntityListField = useCallback(
    async (payload: EntityListFieldPayloadType) => {
      try {
        const res = await API.createEntityListField.query(payload)
        await updateDataModel()
        console.log('CREATE_ENTITY_VALUE', res)
      } catch (e) {
        console.log('ERROR CREATE_ENTITY_VALUE', e)
      }
    },
    [updateDataModel]
  )
  const editEntityListField = useCallback(
    async (payload: EntityListFieldPayloadType) => {
      try {
        const entity_list_field_id = payload?.entity_list_field_id
        if (!entity_list_field_id) return
        const res = await API.editEntityListField(entity_list_field_id).query(
          payload
        )
        await updateDataModel()
      } catch (e) {
        console.log('ERROR EDIT_ENTITY_VALUE', e)
      }
    },
    [updateDataModel]
  )
  const deleteEntityListField = useCallback(
    async (entity_list_field_id: number) => {
      try {
        const res = await API.deleteEntityListField(
          entity_list_field_id
        ).query()
        await updateDataModel()
      } catch (e) {
        console.error(e)
      }
    },
    [updateDataModel]
  )

  const createEntityJoining = useCallback(
    async (payload: EntityJoiningPayloadType) => {
      try {
        const res = await API.createEntityJoining.query(payload)
        await updateDataModel()
      } catch (e) {
        console.log('ERROR CREATING ENTITY_JOINING', e)
      }
    },
    [updateDataModel]
  )
  const editEntityJoining = useCallback(
    async (payload: EntityJoiningPayloadType) => {
      try {
        const entity_joining_id = payload?.entity_joining_id
        if (!entity_joining_id) return
        const res = await API.editEntityJoining(entity_joining_id).query(
          payload
        )
        await updateDataModel()
      } catch (e) {
        console.log('ERROR EDITING ENTITY_JOINING', e)
      }
    },
    [updateDataModel]
  )
  const deleteEntityJoining = useCallback(
    async (entity_joining_id: number) => {
      try {
        const res = await API.deleteEntityJoining(entity_joining_id).query()
        await updateDataModel()
      } catch (e) {
        console.error(e)
      }
    },
    [updateDataModel]
  )

  const createGithubPages = useCallback(async () => {
    try {
      console.log('CREATE GITHUB PAGES')
      const project_id = editorState.project.project_id
      const res = await API.createGithubPages(project_id).query()
      console.log('Activated Github Pages', res)
    } catch (e) {
      console.error("Couldn't activate Github Pages", e)
      console.error(e)
    }
  }, [editorState.project.project_id])

  const deleteGithubPages = useCallback(async () => {
    try {
      const project_id = editorState.project.project_id
      const res = await API.deleteGithubPages(project_id).query()
      console.log('Deactivated Github Pages', res)
    } catch (e) {
      console.error("Couldn't deactivate Github Pages", e)
      console.error(e)
    }
  }, [editorState.project.project_id])

  return {
    data,
    actions: {
      setLoading,
      updateUserData,
      login,
      logout,
      handleRequestWebsiteZipBundle,
      saveProjectToCloud,
      loadProjectFromCload,
      cloneProjectFromCload,
      getLoggedInStatus,
      changeLoginEmail,
      changeLoginPassword,
      changeLogInStatus,
      deleteProjectFromCloud,
      updateUserRepos,
      createEntity,
      editEntity,
      deleteEntity,
      updateDataModel,
      createEntityField,
      editEntityField,
      deleteEntityField,
      createEntityValue,
      editEntityValue,
      deleteEntityValue,
      createEntityList,
      editEntityList,
      deleteEntityList,
      createEntityListField,
      editEntityListField,
      deleteEntityListField,
      deleteEntityJoining,
      editEntityJoining,
      createEntityJoining,
      saveGithubRepo,
      refreshUserRepos,
      deleteGithubPages,
      createGithubPages,
    },
  }
}
