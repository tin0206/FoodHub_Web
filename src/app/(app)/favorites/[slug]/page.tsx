'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { parseRecipeIdFromSlug } from '@/lib/recipe-slug'
import { SaveDetailView } from '@/components/recipe/save-detail-view'

export default function FavoriteRecipeDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const id = parseRecipeIdFromSlug(params.slug)

  useEffect(() => {
    if (id == null) router.replace('/favorites')
  }, [id, router])

  if (id == null) return null

  return (
    <div className="h-full p-3">
      <SaveDetailView recipeId={id} onBack={() => router.push('/favorites')} />
    </div>
  )
}
