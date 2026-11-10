import { type AbilityRow, abilityDisplay, type Player, players } from 'modlock'

import { heroById, type PoolAbility, poolAbility, type PoolHero } from '../draft/pool'
import { ABILITY_SLOTS } from '../draft/slots'
import type { Team } from '../draft/teams'
import { connectedPeople, type HeroRead } from '../match/roster'

/** The picture of an ability outside the pool, which has none of its own here. */
const UNKNOWN_ICON = 's2r://panorama/images/hud/ping/ping_icon_question.vsvg'

interface RowAbility {
  /** The game's name of the ability the hero holds, or '' for none. */
  readonly name: string
  /** Undefined for one outside the pool. */
  readonly ability: PoolAbility | undefined
  /** The bought tiers: bit 0 unlocks it and bits 1 to 3 are its upgrades. */
  readonly upgrades: number
}

interface HeroRow {
  readonly player: Player
  readonly team: Team
  readonly hero: PoolHero | undefined
  readonly abilities: readonly RowAbility[]
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
      return { name: held?.name ?? '', ability: held === undefined ? undefined : poolAbility(held.name), upgrades }
    })
    rows.push({ player: c.player, team: pawn.team, hero: heroById(pawn.hero), abilities })
  }
  return rows.sort((a, b) => a.team - b.team || a.player.slot - b.player.slot)
}

function differs(sent: Map<number, string>, slot: number, text: string): boolean {
  if (sent.get(slot) === text) {
    return false
  }
  sent.set(slot, text)
  return true
}

/**
 * Each hero's four abilities as Modlock's abilityDisplay shows them: the held
 * ability's own window over its pool picture, a question mark for one outside
 * the pool, and the game's own in a slot that holds none.
 */
function displayRows(rows: readonly HeroRow[]): AbilityRow[] {
  return rows.map((r) => ({
    player: r.player,
    abilities: r.abilities.map((a) =>
      a.name === '' ? undefined : { name: a.name, image: a.ability?.icon ?? UNKNOWN_ICON, upgrades: a.upgrades }),
  }))
}

/**
 * Shows every person each hero's drafted abilities on Tab's rows, and their
 * own on their ability bar, through Modlock, which draws them in the game's
 * frames and pips with the game's ability window over each, and gives the
 * game's own back as a person leaves or the screen ends.
 */
export class TabSender {
  private readonly sent = new Map<number, string>()

  /** bought: by slot, the upgrade bits bought on each key this match. */
  send(heroes: readonly HeroRead[], bought: ReadonlyMap<number, readonly number[]>): void {
    const rows = displayRows(heroRows(heroes, bought))
    // Every viewer gets the same rows; Modlock marks each viewer's own.
    const text = JSON.stringify(rows.map((r) => [r.player.slot, r.abilities]))
    for (const c of connectedPeople()) {
      if (differs(this.sent, c.player.slot, text)) {
        abilityDisplay(c.player, rows)
      }
    }
  }

  forget(slot: number): void {
    this.sent.delete(slot)
  }

  /** A new lobby gives every person the game's own abilities back. */
  clear(): void {
    for (const c of players()) {
      abilityDisplay(c.player)
    }
    this.sent.clear()
  }
}
