import { type Ability, type Connection, type Pawn, type Player, players, readField } from 'modlock'

import { AbilitySlot } from '../draft/slots'
import { isTeam } from '../draft/teams'

export function playerAt(slot: number): Player | undefined {
  return players().find((c) => c.player.slot === slot)?.player
}

export function connectedPeople(): Connection[] {
  return players().filter((c) => c.ready && !c.bot)
}

export function controllerOf(pawn: number): number | undefined {
  const controller = readField(pawn, 'CBasePlayerPawn', 'm_hController', 'handle')
  return typeof controller === 'number' ? controller : undefined
}

/** One hero as last read, which the match's work shares: reading a hero's abilities walks the game's entities. */
export interface HeroRead {
  readonly connection: Connection
  readonly pawn: Pawn
  readonly owned: readonly Ability[]
}

/** What the Tab screen and the ability bar show of a hero, to tell a changed read from the same one. */
function shown({ connection, pawn, owned }: HeroRead): string {
  const keys = owned.filter((a) => a.slot <= AbilitySlot.Ultimate).map((a) => `${a.slot}:${a.name}:${a.upgrades}`).sort()
  return [connection.name, pawn.team, pawn.hero, ...keys].join(' ')
}

/**
 * The heroes read one a frame, in turn by player slot, each kept until its next
 * read: a frame reads one hero, so no frame reads them all, and with a dozen
 * players each is read about five times a second.
 */
export class HeroReads {
  private readonly kept = new Map<number, HeroRead>()
  private lastSlot = -1

  /**
   * Reads the next player's hero, or forgets the player while they have none on
   * a team. Answers the read, and whether what it shows differs from the last.
   */
  readNext(): { read: HeroRead; changed: boolean } | undefined {
    const all = players()
    for (const slot of this.kept.keys()) {
      if (!all.some((c) => c.player.slot === slot)) {
        this.kept.delete(slot)
      }
    }
    const later = all.filter((c) => c.player.slot > this.lastSlot)
    const connection = (later.length > 0 ? later : all).reduce<Connection | undefined>(
      (first, c) => (first === undefined || c.player.slot < first.player.slot ? c : first),
      undefined,
    )
    if (connection === undefined) {
      return undefined
    }
    const slot = connection.player.slot
    this.lastSlot = slot
    const pawn = connection.ready ? connection.player.pawn() : undefined
    if (pawn === undefined || !isTeam(pawn.team)) {
      this.kept.delete(slot)
      return undefined
    }
    const read: HeroRead = { connection, pawn, owned: connection.player.abilities() }
    const before = this.kept.get(slot)
    this.kept.set(slot, read)
    return { read, changed: before === undefined || shown(before) !== shown(read) }
  }

  /** The kept reads by player slot, each at most a round of the players old. */
  all(): HeroRead[] {
    return [...this.kept.values()].sort((a, b) => a.connection.player.slot - b.connection.player.slot)
  }

  clear(): void {
    this.kept.clear()
    this.lastSlot = -1
  }
}
