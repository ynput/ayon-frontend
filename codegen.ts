import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: [
    {
      'http://localhost:3000/graphql': {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      },
    },
  ],
  documents: './src/**/*.graphql',
  generates: {
    './src/types/graphqlTypes.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        {
          'typescript-rtk-query': {
            importBaseApiFrom: 'src/services/ayon',
            importBaseApiAlternateName: 'GraphQL',
            exportHooks: true,
          },
        },
      ],
    },
  },
}
export default config
