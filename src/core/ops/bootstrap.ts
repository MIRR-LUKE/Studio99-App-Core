export const buildProjectBootstrapManifest = ({
  name,
  projectKey,
}: {
  name: string
  projectKey: string
}) => ({
  collections: [`${projectKey}-records`, `${projectKey}-reports`],
  docs: ['README.md', 'docs/bootstrap.md', `docs/projects/${projectKey}.md`, `docs/projects/${projectKey}-billing.md`],
  name,
  projectKey,
  files: [
    `src/projects/${projectKey}/README.md`,
    `src/projects/${projectKey}/project.config.ts`,
    `src/projects/${projectKey}/feature-flags.ts`,
    `src/projects/${projectKey}/billing-note.md`,
  ],
  routes: [`/app/${projectKey}`, `/api/${projectKey}`],
})
