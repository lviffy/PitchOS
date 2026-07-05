module.exports = {
  forbidden: [
    {
      name: 'no-cross-feature-imports',
      comment: 'Enforce domain isolation: features should not import from other features directly.',
      severity: 'error',
      from: { path: '^apps/client/src/features/([^/]+)/.+' },
      to: {
        path: '^apps/client/src/features/([^/]+)/.+',
        pathNot: '^apps/client/src/features/$1/.+'
      }
    },
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Circular dependencies should be avoided.',
      from: {},
      to: { circular: true }
    }
  ],
  options: {
    doNotCruise: {
      path: 'node_modules'
    },
    tsPreCruiser: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
