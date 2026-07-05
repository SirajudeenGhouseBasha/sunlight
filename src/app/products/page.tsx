import { redirect } from 'next/navigation'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, Array.isArray(value) ? value[0] : value)
  }
  const q = qs.toString()
  redirect(`/predesigned${q ? `?${q}` : ''}`)
}
