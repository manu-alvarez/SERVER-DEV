import '@mui/material/Chip'

declare module '@mui/material/Chip' {
  /** Variante ceremonial para estados de ejecución/servicio (definida en theme.ts). */
  interface ChipPropsVariantOverrides {
    status: true
  }
}
