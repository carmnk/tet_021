import { ReactNode } from 'react'
import { CChip, CChipProps } from '../../../_external/Chip'

export type ChipWrapperProps = CChipProps & {
  rootInjection: ReactNode
}
export const ChipWrapper = (props: ChipWrapperProps) => {
  const { children, rootInjection, label, ...rest } = props
  const labelComponent = (
    <>
      {label}
      {rootInjection}
    </>
  )
  return <CChip {...rest} label={labelComponent}></CChip>
}
