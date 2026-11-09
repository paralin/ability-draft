import { poolHeroes } from './pool.gen'

export { poolHeroes }

/** Pawn.hero for a player without a hero; Modlock's types do not say so. */
export const NO_HERO = 0

export interface PoolAbility {
  /** Such as citadel_ability_card_toss. */
  readonly name: string
  /** An image's src. */
  readonly icon: string
}

export interface PoolHero {
  /** Such as hero_wraith. */
  readonly name: string
  /** As Pawn.hero reports it. */
  readonly id: number
  /** Such as Wraith. */
  readonly title: string
  /** The small one, as an image's src. */
  readonly portrait: string
  /** By AbilitySlot. */
  readonly abilities: readonly PoolAbility[]
}

/** The tall 280 by 380 portrait the game keeps beside each small one. */
export function heroCard(hero: PoolHero): string {
  return hero.portrait.replace(/_sm\.(psd|png)$/, '_card.psd')
}

export function heroById(id: number): PoolHero | undefined {
  return poolHeroes.find((h) => h.id === id)
}

const poolAbilities = new Map(poolHeroes.flatMap((h) => h.abilities.map((a) => [a.name, a] as const)))

/**
 * Abilities the board shows crossed out from the start, which nobody may
 * draft. Sinclair's Audience Participation, drafted onto another hero, copies
 * nothing. Deadman Danny's Charge Blast and Flamethrower take the ability on
 * the hero's second key as his Rocketeer, and with any other ability there the
 * server crashes.
 */
const LEFT_OUT_ABILITIES: ReadonlySet<string> = new Set([
  'ability_magician_copyult',
  'ability_deadpack_chargeblast',
  'ability_deadpack_flamethrower',
])

export function drafted(ability: PoolAbility): boolean {
  return !LEFT_OUT_ABILITIES.has(ability.name)
}

/**
 * The offered ability named name, or the one whose form in use it is, such as
 * ability_fencer_riposte for ability_fencer_riposte_target_select.
 */
export function poolAbility(name: string): PoolAbility | undefined {
  const own = poolAbilities.get(name)
  if (own !== undefined) {
    return own
  }
  let best: PoolAbility | undefined
  for (const base of poolAbilities.values()) {
    if (name.startsWith(`${base.name}_`) && (best === undefined || base.name.length > best.name.length)) {
      best = base
    }
  }
  return best
}
