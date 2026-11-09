import type { Draft } from './draft'
import { drafted, type PoolAbility, poolHeroes } from './pool'
import { shuffled } from './shuffled'
import { AbilitySlot, REGULAR_ABILITIES } from './slots'

/** For a seat that came after the draft: random abilities nobody drafted, by AbilitySlot. */
export function leftoverPicks(draft: Draft): (PoolAbility | undefined)[] {
  const taken = new Set(draft.seats.flatMap((s) => s.picks.flatMap((p) => (p ? [p.name] : []))))
  const leftovers = (column: (i: number) => boolean) =>
    shuffled(poolHeroes.flatMap((h) => h.abilities.filter((a, i) => column(i) && drafted(a) && !taken.has(a.name))))
  const regular = leftovers((i) => i !== AbilitySlot.Ultimate).slice(0, REGULAR_ABILITIES)
  const ultimate = leftovers((i) => i === AbilitySlot.Ultimate)[0]
  return [regular[AbilitySlot.First], regular[AbilitySlot.Second], regular[AbilitySlot.Third], ultimate]
}
