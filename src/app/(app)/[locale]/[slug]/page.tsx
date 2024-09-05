import { Badge } from '@/components/Badge'
import { Background } from '@/components/Background'
import Link from 'next/link'
import React from 'react'
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'

const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: 'de' | 'en' | 'es' | 'bn'; slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const payload = await getPayloadHMR({
    config,
  })

  const data = await payload.find({
    collection: 'pages',
    locale: params.locale,
    where: {
      slug: {
        equals: params.slug,
      },
    },
  })

  const { docs } = data

  const pageData = docs[0]

  return (
    <>
      <main>{pageData.title}</main>
      <Background />
    </>
  )
}

export default Page
