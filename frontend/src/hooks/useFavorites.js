/**
 * hooks/useFavorites.js
 *
 * WHY THIS HOOK EXISTS (bug fix):
 * Both ProblemCard and ProblemDetailPage previously did
 * `useState(false)` for their "favorited" flag, completely
 * disconnected from the server. This meant a problem the user
 * had already favorited would always render with an empty star
 * the next time they saw the card — until they clicked it, which
 * then hit a 409 "already in favorites" and silently did nothing.
 *
 * This hook centralizes favorites state behind a single React Query
 * cache entry (QUERY_KEYS.FAVORITES) so every consumer reads the
 * same source of truth, and exposes a single `toggleFavorite`
 * mutation with an OPTIMISTIC update — the star flips instantly,
 * and rolls back automatically if the request fails. This also
 * fixes the dead exit-animation bug on the Favorites page grid,
 * since removed items now leave the cached array immediately
 * instead of waiting for a full invalidate+refetch round trip.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { favoritesService } from '../services'
import { QUERY_KEYS } from '../constants'
import { extractErrorMessage } from '../utils'

export const useFavoritesList = () =>
  useQuery({
    queryKey: QUERY_KEYS.FAVORITES,
    queryFn: () => favoritesService.list({ limit: 200 }).then((r) => r.data.data),
    staleTime: 1000 * 30,
  })

/**
 * Returns whether a given problem slug is currently favorited,
 * derived from the shared favorites cache — never local component state.
 */
export const useIsFavorited = (problemSlug) => {
  const { data } = useFavoritesList()
  return !!data?.some((f) => f.problem_slug === problemSlug)
}

/**
 * Single mutation handling both add and remove with optimistic updates.
 * Pass the full problem fields for `add`; only the slug is required for `remove`.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ isFavorited, problemSlug, problemTitle, problemDifficulty }) => {
      if (isFavorited) {
        await favoritesService.remove(problemSlug)
      } else {
        await favoritesService.add({ problemSlug, problemTitle, problemDifficulty })
      }
    },
    onMutate: async ({ isFavorited, problemSlug, problemTitle, problemDifficulty }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FAVORITES })
      const previous = queryClient.getQueryData(QUERY_KEYS.FAVORITES)

      queryClient.setQueryData(QUERY_KEYS.FAVORITES, (old = []) => {
        if (isFavorited) {
          return old.filter((f) => f.problem_slug !== problemSlug)
        }
        // Optimistic placeholder — replaced by real row on next refetch
        return [
          { id: `optimistic-${problemSlug}`, problem_slug: problemSlug, problem_title: problemTitle, problem_difficulty: problemDifficulty, created_at: new Date().toISOString() },
          ...old,
        ]
      })

      return { previous }
    },
    onError: (err, _vars, context) => {
      // Roll back to the pre-mutation cache on failure
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.FAVORITES, context.previous)
      }
      toast.error(extractErrorMessage(err))
    },
    onSuccess: (_data, { isFavorited }) => {
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FAVORITES })
    },
  })

  return mutation
}
