export const managedCollectionVersions = {
  drafts: {
    autosave: {
      interval: 1500,
      showSaveDraftButton: true,
    },
    schedulePublish: true,
    validate: false,
  },
  maxPerDoc: 50,
}

export const featureFlagVersions = {
  drafts: {
    autosave: false,
    schedulePublish: false,
    validate: true,
  },
  maxPerDoc: 25,
}

export const managedGlobalVersions = {
  drafts: {
    autosave: {
      interval: 1500,
      showSaveDraftButton: true,
    },
    schedulePublish: true,
    validate: false,
  },
  max: 50,
}
