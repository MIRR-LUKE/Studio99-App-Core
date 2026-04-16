import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  {
    ignores: ['payload-types.ts', 'src/app/(payload)/admin/importMap.js'],
  },
  ...nextVitals,
])
