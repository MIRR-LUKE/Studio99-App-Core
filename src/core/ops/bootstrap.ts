export const buildProjectBootstrapManifest = ({
  name,
  projectKey,
}: {
  name: string
  projectKey: string
}) => ({
  collections: [`${projectKey}-records`, `${projectKey}-reports`],
  docs: ['README.md', 'docs/bootstrap.md', `docs/projects/${projectKey}.md`],
  name,
  projectKey,
  routes: [`/app/${projectKey}`, `/api/${projectKey}`],
})
