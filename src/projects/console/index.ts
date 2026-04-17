import { projectConfig } from './project.config'
import { projectFeatureFlags } from './feature-flags'
import { consoleProjectCollectionConfigs, consoleProjectCollectionSummaries } from './collections'

export const consoleProject = {
  billing: projectConfig.billing,
  collections: consoleProjectCollectionSummaries,
  featureFlags: Object.values(projectFeatureFlags),
  key: projectConfig.key,
  name: projectConfig.name,
  purpose: projectConfig.purpose,
  routes: projectConfig.routes,
  sourceRoot: 'src/projects/console',
  template: projectConfig.template,
} as const

export { consoleProjectCollectionConfigs, consoleProjectCollectionSummaries }
