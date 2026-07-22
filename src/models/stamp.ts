export type StampDefinition = {
  id: string
  category: string
  label: string
  defaultText?: string
  iconType?: string
  defaultStyle: {
    backgroundColor: string
    textColor: string
    borderColor?: string
  }
}
