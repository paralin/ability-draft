import { type Ability, log, type Pawn, type Player } from 'modlock'

import type { PoolAbility } from '../draft/pool'
import { ABILITY_SLOTS, AbilitySlot } from '../draft/slots'
import { makeRoomFor } from './brought'

/**
 * A hero's abilities can change only once it has fully spawned: alive, with
 * stamina, and owning its four ability keys. owned is a function because reading
 * a hero's abilities walks the game's entities, and a hero not up yet skips that.
 */
export function spawned(pawn: Pawn, owned: () => readonly Ability[]): boolean {
  if (pawn.health <= 0 || pawn.stamina === undefined) {
    return false
  }
  const slots = new Set(owned().map((a) => a.slot))
  return ABILITY_SLOTS.every((slot) => slots.has(slot))
}

interface Wanted {
  readonly ability: PoolAbility
  readonly slot: AbilitySlot
}

/**
 * A drafted ability the hero holds in another slot waits until that slot has
 * changed, so the hero never holds it twice when it can be helped.
 */
export function grant(
  player: Player,
  picks: readonly (PoolAbility | undefined)[],
  owned: readonly Ability[],
): void {
  if (owned.length === 0) {
    return
  }
  const wanted: Wanted[] = picks.flatMap((ability, slot) => (ability === undefined ? [] : [{ ability, slot }]))
  const elsewhere = ({ ability, slot }: Wanted) =>
    owned.some((a) => a.name === ability.name && a.slot !== slot && a.slot <= AbilitySlot.Ultimate)
  for (const w of wanted.filter((w) => !elsewhere(w))) {
    give(player, owned, w)
  }
  for (const w of wanted.filter(elsewhere)) {
    give(player, player.abilities(), w)
  }
}

/**
 * The game turns some abilities into another form while they are used, such as
 * ability_fencer_riposte_target_select for ability_fencer_riposte. Putting the
 * drafted ability back over such a form mid-use crashed the server.
 */
function alreadyGiven(held: Ability | undefined, ability: PoolAbility): boolean {
  return held !== undefined && (held.name === ability.name || held.name.startsWith(`${ability.name}_`))
}

/**
 * Lycan Curse swaps the first three keys for the wolf's abilities while it
 * runs and puts the held ones back when it ends (abilities.vdata,
 * ability_werewolf_transformation's m_mapWerewolfAbilities; no other ability
 * swaps keys). Putting drafted abilities over the wolf's gave them back with
 * no upgrades, locked.
 */
const SWAPPED_IN: Readonly<Record<string, readonly string[]>> = {
  ability_werewolf_transformation: ['ability_werewolf_frenzy', 'ability_werewolf_maulingleap', 'ability_werewolf_cripplingslash'],
}

function swappedIn(held: Ability | undefined, owned: readonly Ability[]): boolean {
  return held !== undefined && owned.some((a) => SWAPPED_IN[a.name]?.includes(held.name) === true)
}

/**
 * Keeps each key's upgrades: bought holds the upgrade bits bought on each key
 * this match, and whatever ability of the key it holds has them all: the
 * drafted one, given back after the game put its own abilities back, the form
 * it turns into once pressed, such as ability_magician_cloneturret_trigger,
 * or the wolf's while Lycan Curse runs.
 */
export function keepUpgrades(
  player: Player,
  picks: readonly (PoolAbility | undefined)[],
  owned: readonly Ability[],
  bought: number[],
): void {
  for (const slot of ABILITY_SLOTS) {
    const held = owned.find((a) => a.slot === slot)
    const pick = picks[slot]
    if (held === undefined || pick === undefined || !(alreadyGiven(held, pick) || swappedIn(held, owned))) {
      continue
    }
    const merged = (bought[slot] ?? 0) | held.upgrades
    bought[slot] = merged
    if (merged !== held.upgrades && player.setAbility({ ability: held.name, upgrades: merged })) {
      log(`draft: kept upgrades ${merged} of key ${slot} on ${held.name} of player ${player.slot}`)
    }
  }
}

function give(player: Player, owned: readonly Ability[], { ability, slot }: Wanted): void {
  const held = owned.find((a) => a.slot === slot)
  if (alreadyGiven(held, ability) || swappedIn(held, owned)) {
    return
  }
  makeRoomFor(player, ability.name)
  if (!player.replaceAbility(slot, ability.name)) {
    log(`draft: could not give ${ability.name} to slot ${slot} of player ${player.slot}`)
    return
  }
  log(`draft: gave ${ability.name} to slot ${slot} of player ${player.slot} in place of ${held?.name}`)
  if (held !== undefined && held.upgrades !== 0) {
    player.setAbility({ ability: ability.name, upgrades: held.upgrades })
  }
}
