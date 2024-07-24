import { ElementType } from '../editorController/editorState'
import { v4 as uuid } from 'uuid'

export const baseHtmlDocument: ElementType[] = [
  // {
  //   id: "html_root",
  //   type: "html",
  //   attributes: {
  //     style: {
  //       height: "100%",
  //     },
  //   },
  //   children: [
  //     {
  //       id: "head_root",
  //       type: "head",
  //       // children: [
  //       // ]
  //       attributes: {
  //         // style: {
  //         //   backgroundColor: "red",
  //         // },
  //       }
  //     },
  {
    _id: uuid(),
    _type: 'div',
    _disableDelete: true,
    _page: 'index',
    _parentId: null,
    _userID: '',

    attributes: {
      style: {
        height: '100%',
      },
    },
  },
  //   ],
  // },
]
