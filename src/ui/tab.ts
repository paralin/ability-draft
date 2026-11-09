import type { Player } from 'modlock'

import { heroById, type PoolAbility, poolAbility, type PoolHero } from '../draft/pool'
import { ABILITY_SLOTS } from '../draft/slots'
import type { Team } from '../draft/teams'
import { connectedPeople, type HeroRead } from '../match/roster'
import { type Mine, routeMine, routeTab, type TabHero } from './client'

interface RowAbility {
  /** Undefined for one outside the pool. */
  readonly ability: PoolAbility | undefined
  /** The bought tiers: bit 0 unlocks it and bits 1 to 3 are its upgrades. */
  readonly upgrades: number
}

interface HeroRow {
  readonly slot: number
  readonly name: string
  readonly team: Team
  readonly hero: PoolHero | undefined
  readonly abilities: readonly RowAbility[]
  /** The ability points and unlocks the player holds unspent. */
  readonly points: number
  readonly unlocks: number
}

/**
 * A key shows the upgrades bought on it this match, from bought by player and
 * key, as well as what its ability holds: an ability turns into another form
 * once pressed, such as ability_magician_cloneturret_trigger, which teleports
 * to the clone ability_magician_cloneturret made, and Lycan Curse swaps in the
 * wolf's; such a form is an ability of its own, with no upgrades, though the
 * key's are there all along.
 */
function heroRows(heroes: readonly HeroRead[], bought: ReadonlyMap<number, readonly number[]>): HeroRow[] {
  const rows: HeroRow[] = []
  for (const { connection: c, pawn, owned } of heroes) {
    const keys = bought.get(c.player.slot) ?? []
    const abilities: RowAbility[] = ABILITY_SLOTS.map((slot) => {
      const held = owned.find((a) => a.slot === slot)
      const upgrades = (keys[slot] ?? 0) | (held?.upgrades ?? 0)
      return { ability: held === undefined ? undefined : poolAbility(held.name), upgrades }
    })
    rows.push({
      slot: c.player.slot,
      name: c.name,
      team: pawn.team,
      hero: heroById(pawn.hero),
      abilities,
      points: pawn.abilityPoints,
      unlocks: pawn.abilityUnlocks,
    })
  }
  return rows.sort((a, b) => a.team - b.team || a.slot - b.slot)
}

function differs(sent: Map<number, string>, slot: number, value: unknown): boolean {
  const text = JSON.stringify(value)
  if (sent.get(slot) === text) {
    return false
  }
  sent.set(slot, text)
  return true
}

export class TabSender {
  private readonly tabSent = new Map<number, string>()
  private readonly mineSent = new Map<number, string>()

  /** bought: by slot, the upgrade bits bought on each key this match. */
  send(heroes: readonly HeroRead[], bought: ReadonlyMap<number, readonly number[]>): void {
    const rows = heroRows(heroes, bought)
    // The Tab screen's list holds each hero's abilities by name, with their
    // upgrades and icons; the game's own ability window shows the rest.
    // Modlock sends the whole screen to the game on any change, so the
    // routes stay small.
    const tab = rows.map((r) => ({
      s: r.slot,
      n: r.name,
      h: r.hero?.name ?? '',
      a: r.abilities.map((a): readonly [string, number, string] => [a.ability?.name ?? '', a.upgrades, a.ability?.icon ?? '']),
    }))
    for (const c of connectedPeople()) {
      this.sendTab(c.player, tab)
      this.sendMine(c.player, rows)
    }
  }

  private sendTab(player: Player, tab: readonly TabHero[]): void {
    if (differs(this.tabSent, player.slot, tab)) {
      routeTab(player, tab)
    }
  }

  private sendMine(player: Player, rows: readonly HeroRow[]): void {
    // The game's ability bar shows the upgrades of the hero's own ability for
    // each slot, so the client layout lights every slot's pips from these, and
    // which the player can buy from the points and unlocks; a click on the bar
    // is the mod's, see src/match/upgrades.ts.
    const own = rows.find((r) => r.slot === player.slot)
    const mine: Mine = own === undefined
      ? { u: [], p: 0, k: 0 }
      : { u: own.abilities.map((a) => a.upgrades), p: own.points, k: own.unlocks }
    if (differs(this.mineSent, player.slot, mine)) {
      routeMine(player, mine)
    }
  }

  forget(slot: number): void {
    this.tabSent.delete(slot)
    this.mineSent.delete(slot)
  }

  clear(): void {
    this.tabSent.clear()
    this.mineSent.clear()
  }
}
