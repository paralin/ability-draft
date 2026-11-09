import { type Connection, players } from 'modlock'

import { BrokerOpening } from '../broker/broker'
import { Team, TEAM_SEATS } from '../draft/teams'
import { connectedPeople } from '../match/roster'
import type { LobbyRoom, SeatedBot } from '../ui/lobby'

/** So one can still take their ready back. */
const START_SECONDS = 3

const BOT_NAMES: readonly string[] = ['Ava', 'Bo', 'Cy', 'Dex', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lux']

interface WaitingPerson {
  readonly connection: Connection
  readonly team: Team
}

export class Room {
  /** helper: whether a slot is one of the tooltips' helpers, which the room does not count. */
  constructor(private readonly helper: (slot: number) => boolean) {}

  /** By slot, until the draft gives them a hero. */
  private readonly teams = new Map<number, Team>()
  private readonly lobbyReady = new Set<number>()
  private startAt: number | undefined
  private readonly seatedBots: SeatedBot[] = []
  /** Kept from one lobby to the next. */
  private broker = BrokerOpening.Thirty

  teamOf(slot: number): Team | undefined {
    return this.teams.get(slot)
  }

  /** In the order they took their seats. */
  bots(): readonly SeatedBot[] {
    return this.seatedBots
  }

  /** Whatever room the team has; openTeam names one that has some. */
  seat(slot: number, team: Team): void {
    this.teams.set(slot, team)
  }

  /**
   * Forgets the team and the ready of each person no longer here, so a team
   * counts only those who are, and whoever takes the slot next starts afresh.
   */
  forgetLeft(present: ReadonlySet<number>): void {
    for (const slot of this.teams.keys()) {
      if (!present.has(slot)) {
        this.teams.delete(slot)
        this.lobbyReady.delete(slot)
      }
    }
  }

  private people(): WaitingPerson[] {
    return connectedPeople().flatMap((connection) => {
      const team = this.teams.get(connection.player.slot)
      return team === undefined ? [] : [{ connection, team }]
    })
  }

  private teamCount(team: Team): number {
    return this.people().filter((p) => p.team === team).length + this.seatedBots.filter((s) => s.team === team).length
  }

  /**
   * When the team has room. A change of the teams takes back every ready, so the
   * draft starts only with teams everyone pressed ready for.
   */
  join(slot: number, team: Team): void {
    if (this.teams.get(slot) === team || this.teamCount(team) >= TEAM_SEATS) {
      return
    }
    this.teams.set(slot, team)
    this.lobbyReady.clear()
  }

  /** When the team has room; it takes back every ready, as join does. */
  seatBot(team: Team): void {
    if (this.teamCount(team) >= TEAM_SEATS) {
      return
    }
    this.seatedBots.push({ name: this.freeBotName(), team })
    this.lobbyReady.clear()
  }

  unseatBot(index: number): void {
    if (this.seatedBots.splice(index, 1).length > 0) {
      this.lobbyReady.clear()
    }
  }

  /** Takes back every ready, as a change of the teams or the bots does. */
  chooseBroker(opening: BrokerOpening): void {
    if (this.broker !== opening) {
      this.broker = opening
      this.lobbyReady.clear()
    }
  }

  brokerOpening(): BrokerOpening {
    return this.broker
  }

  toggleReady(slot: number): void {
    if (!this.teams.has(slot)) {
      return
    }
    if (!this.lobbyReady.delete(slot)) {
      this.lobbyReady.add(slot)
    }
  }

  /**
   * Runs the count and says whether it ran out: START_SECONDS after every person
   * in the lobby is ready; one who takes it back, a new person, or a change of
   * the teams or the bots stops it.
   * view shows what this leaves, so this comes first in a frame.
   */
  advanceCountdown(now: number): boolean {
    const people = this.people()
    if (people.length === 0 || !people.every((p) => this.lobbyReady.has(p.connection.player.slot))) {
      this.startAt = undefined
      return false
    }
    this.startAt ??= now + START_SECONDS
    return now >= this.startAt
  }

  /** The game keeps one bot to a name. */
  private freeBotName(): string {
    const inMatch = players().filter((c) => c.bot).map((c) => c.name)
    const taken = new Set([...this.seatedBots.map((s) => s.name), ...inMatch])
    return BOT_NAMES.find((name) => !taken.has(name)) ?? `Bot ${taken.size + 1}`
  }

  /** Team.HiddenKing on a tie. Counts those waiting, the seated bots and the heroes on the map but the helpers. */
  private smallerTeam(): Team {
    const onTeams: (number | undefined)[] = [
      ...this.people().map((p) => p.team),
      ...this.seatedBots.map((s) => s.team),
      ...players().filter((c) => !this.teams.has(c.player.slot) && !this.helper(c.player.slot)).map((c) => c.player.pawn()?.team),
    ]
    const size = (team: Team) => onTeams.filter((t) => t === team).length
    return size(Team.HiddenKing) <= size(Team.Archmother) ? Team.HiddenKing : Team.Archmother
  }

  /**
   * The smaller team when both have a seat, else the one that has; undefined
   * once both are full, and the person waits with no seat. Only a choice
   * between two open teams reads the heroes on the map, so those who wait
   * with no seat cost nothing each frame.
   */
  openTeam(): Team | undefined {
    const open = [Team.HiddenKing, Team.Archmother].filter((team) => this.teamCount(team) < TEAM_SEATS)
    return open.length === 2 ? this.smallerTeam() : open[0]
  }

  view(now: number): LobbyRoom {
    const waiting = this.people()
    const people = waiting.map(({ connection: c, team }) => ({
      slot: c.player.slot,
      name: c.name,
      steamId: c.steamId,
      team,
      ready: this.lobbyReady.has(c.player.slot),
    }))
    const bots = this.seatedBots.map((s, index) => ({ ...s, index }))
    const startsIn = this.startAt === undefined ? undefined : Math.max(0, Math.ceil(this.startAt - now))
    // Those with no seat see the lobby too, to wait for one.
    return { connections: connectedPeople(), people, bots, startsIn, broker: this.broker }
  }

  clearTeams(): void {
    this.teams.clear()
  }

  clear(): void {
    this.teams.clear()
    this.lobbyReady.clear()
    this.startAt = undefined
    this.seatedBots.length = 0
  }
}
