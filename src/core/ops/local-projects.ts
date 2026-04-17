import { readdir } from 'node:fs/promises'
import path from 'node:path'

const PROJECTS_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), 'src', 'projects')

export const listLocalProjects = async () => {
  const entries = await readdir(PROJECTS_ROOT, { withFileTypes: true }).catch(() => [])

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      docsPath: `docs/projects/${entry.name}.md`,
      key: entry.name,
      route: `/app/${entry.name}`,
    }))
    .sort((left, right) => left.key.localeCompare(right.key))
}
