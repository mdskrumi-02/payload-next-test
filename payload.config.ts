import path from 'path'
// import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from 'payload/i18n/en'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'
import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  ChecklistFeature,
  HeadingFeature,
  IndentFeature,
  InlineCodeFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig, CollectionAfterChangeHook } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const locales = ['bn', 'de', 'es']

const afterChangeHook: CollectionAfterChangeHook = async ({ doc, req, operation, previousDoc }) => {
  console.log(doc, req.locale, operation)

  if (req.locale === 'en' && operation === 'update') {
    const payload = req.payload

    for (let i = 0; i < locales.length; i++) {
      const result = await payload.update({
        collection: 'pages',
        id: previousDoc.id,
        data: {
          title: doc.title + ' ' + locales[i],
        },
        locale: locales[i] as 'en' | 'bn',
        depth: 2,
        context: {
          triggerAfterChange: false,
        },
      })

      console.log({ result })
    }
  }
}

export default buildConfig({
  //editor: slateEditor({}),
  editor: lexicalEditor(),
  collections: [
    {
      slug: 'users',
      auth: true,
      access: {
        delete: () => false,
        update: () => false,
      },
      fields: [],
    },
    {
      slug: 'pages',
      admin: {
        useAsTitle: 'slug',
      },
      fields: [
        {
          name: 'slug',
          type: 'text',
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'content',
          type: 'richText',
        },
      ],
      hooks: {
        // beforeChange: [beforeChangeHook],
        afterChange: [afterChangeHook],
      },
    },
    {
      slug: 'media',
      upload: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // db: postgresAdapter({
  //   pool: {
  //     connectionString: process.env.POSTGRES_URI || ''
  //   }
  // }),
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
    transactionOptions: false,
  }),

  /**
   * Payload can now accept specific translations from 'payload/i18n/en'
   * This is completely optional and will default to English if not provided
   */
  i18n: {
    supportedLanguages: { en },
  },
  localization: {
    locales: ['en', 'bn', 'de', 'es'],
    defaultLocale: 'en',
    fallback: true,
  },

  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: s3Adapter({
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY!,
                secretAccessKey: process.env.S3_SECRET_KEY!,
              },
              region: process.env.S3_REGION!,
              // ... Other S3 configuration
            },
            bucket: process.env.S3_BUCKET!,
          }), // see docs for the adapter you want to use
        },
      },
    }),
  ],

  admin: {
    autoLogin: {
      email: 'dev@payloadcms.com',
      password: 'test',
      prefillOnly: true,
    },
  },
  async onInit(payload) {
    const existingUsers = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          password: 'test',
        },
      })
    }
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.

  // This is temporary - we may make an adapter pattern
  // for this before reaching 3.0 stable
  sharp,
})
