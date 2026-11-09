import { drafted, type PoolAbility, type PoolHero, poolHeroes } from './pool'
import { shuffled } from './shuffled'
import { ABILITY_SLOTS, AbilitySlot } from './slots'
import { Team } from './teams'

/** The board column after the abilities' columns, which AbilitySlot numbers. */
export const HERO_COLUMN = 4

export const NO_SEAT = -1

const PICKS_PER_SEAT = ABILITY_SLOTS.length + 1

/** Dota studies its board for 60. */
const PREVIEW_SECONDS = 60
/** Dota picks in 7. */
const PICK_SECONDS = 10
/** Also the turn of a seat whose player left. */
const BOT_SECONDS = 1.5

export interface Entrant {
  slot: number
  name: string
  bot: boolean
  team: Team
  /** So a seat goes back only to its own player; a bot has none. */
  steamId?: bigint
}

export interface Seat extends Entrant {
  /** Drafted from the board, or what a late seat plays. */
  hero?: PoolHero
  /** By AbilitySlot. */
  picks: (PoolAbility | undefined)[]
  /** The player left; the draft then picks for them at once. */
  away: boolean
}

export interface Spot {
  /** Index into Draft.board. */
  heroIndex: number
  column: AbilitySlot | typeof HERO_COLUMN
}

interface Taken {
  seat: number
  /** Unset for an ability. */
  hero?: PoolHero
}

export enum Phase {
  Preview = 'preview',
  Picking = 'picking',
  Done = 'done',
}

/**
 * Six full rows of three on the screen, and two rows of nine ultimates,
 * however many seats there are.
 */
export const POOL_SIZE = 18

/** Random heroes nobody plays fill the board, sorted as the screen draws them; the seats draft theirs from it. */
export function pickBoard(excludedHeroIds: ReadonlySet<number>): PoolHero[] {
  const free = shuffled(poolHeroes.filter((h) => !excludedHeroIds.has(h.id)))
  return free.slice(0, POOL_SIZE).sort((a, b) => a.title.localeCompare(b.title))
}

export class Draft {
  /** Shuffled; order and every seat index point into this. */
  readonly seats: Seat[]
  /** In the order the screen draws their rows. */
  readonly board: PoolHero[]
  /** The seat index of each turn: a snake, reversed every round. */
  readonly order: number[]
  /** Index into order. */
  turn = 0
  phase: Phase = Phase.Preview
  /** When the preview or the current turn ends, on the flow's clock. */
  deadline: number
  readonly history: Taken[] = []
  /** Seat indexes done studying the board during the preview. */
  readonly ready = new Set<number>()
  private readonly abilityTakers = new Map<string, Seat>()
  private readonly heroTakers = new Map<string, Seat>()
  /** By seat index: each drafter's ping, a press outside their turn, as Hearthstone's pings. */
  private readonly pings = new Map<number, Spot>()

  /** board: as pickBoard picks it. */
  constructor(entrants: readonly Entrant[], board: readonly PoolHero[], now: number) {
    this.seats = shuffled(entrants).map((entrant) => ({
      ...entrant,
      picks: ABILITY_SLOTS.map(() => undefined),
      away: false,
    }))
    this.board = [...board]
    this.order = snakeOrder(this.seats)
    this.deadline = now + PREVIEW_SECONDS
  }

  /** The index of the seat on turn, or NO_SEAT outside picking. */
  current(): number {
    return this.phase === Phase.Picking ? this.order[this.turn] : NO_SEAT
  }

  /** NO_SEAT when the player has no seat. */
  seatIndexOf(slot: number): number {
    return this.seats.findIndex((s) => s.slot === slot)
  }

  seatAt(slot: number): Seat | undefined {
    return this.seats.find((s) => s.slot === slot)
  }

  secondsLeft(now: number): number {
    return Math.max(0, Math.ceil(this.deadline - now))
  }

  currentSeat(): Seat | undefined {
    return this.seats[this.current()]
  }

  abilityTaker(ability: PoolAbility): Seat | undefined {
    return this.abilityTakers.get(ability.name)
  }

  heroTaker(hero: PoolHero): Seat | undefined {
    return this.heroTakers.get(hero.name)
  }

  mayTake(seatIndex: number, spot: Spot): boolean {
    const drafter = this.seats[seatIndex]
    const hero = this.board[spot.heroIndex]
    if (drafter === undefined || hero === undefined) {
      return false
    }
    if (spot.column === HERO_COLUMN) {
      return !this.heroTakers.has(hero.name) && drafter.hero === undefined
    }
    const ability = hero.abilities[spot.column]
    return ability !== undefined && drafted(ability) && !this.abilityTakers.has(ability.name) &&
      freeSlot(drafter, spot.column) >= 0
  }

  private choices(seatIndex: number): Spot[] {
    const spots: Spot[] = []
    this.board.forEach((_, heroIndex) => {
      for (const column of [...ABILITY_SLOTS, HERO_COLUMN]) {
        if (this.mayTake(seatIndex, { heroIndex, column })) {
          spots.push({ heroIndex, column })
        }
      }
    })
    return spots
  }

  /** Passes the turn on; false when the pick is not allowed. */
  pick(seatIndex: number, spot: Spot, now: number): boolean {
    if (this.phase !== Phase.Picking || seatIndex !== this.current() || !this.mayTake(seatIndex, spot)) {
      return false
    }
    const drafter = this.seats[seatIndex]
    const hero = this.board[spot.heroIndex]
    if (spot.column === HERO_COLUMN) {
      drafter.hero = hero
      this.heroTakers.set(hero.name, drafter)
      this.history.push({ seat: seatIndex, hero })
    } else {
      const ability = hero.abilities[spot.column]
      drafter.picks[freeSlot(drafter, spot.column)] = ability
      this.abilityTakers.set(ability.name, drafter)
      this.history.push({ seat: seatIndex })
    }
    this.next(now)
    return true
  }

  /**
   * Shows the drafter's team a spot the drafter could take, until someone takes
   * it; a drafter's new ping replaces their last, and a second on the same spot
   * takes it back. False when they could not take the spot.
   */
  ping(seatIndex: number, spot: Spot): boolean {
    const last = this.pings.get(seatIndex)
    if (last !== undefined && last.heroIndex === spot.heroIndex && last.column === spot.column) {
      this.pings.delete(seatIndex)
      return true
    }
    if (!this.mayTake(seatIndex, spot)) {
      return false
    }
    this.pings.set(seatIndex, spot)
    return true
  }

  /** The drafters of team pinging spot, while they could still take it. */
  pingersOf(spot: Spot, team: Team): Seat[] {
    return this.seats.filter((seat, index) => {
      const ping = this.pings.get(index)
      return seat.team === team && ping !== undefined && ping.heroIndex === spot.heroIndex &&
        ping.column === spot.column && this.mayTake(index, spot)
    })
  }

  /**
   * A bot's pick, or one for a turn that ran out: the seat's own ping while it
   * may take it, else at random, leaving alone what the seat's teammates
   * pinged while anything else is left.
   */
  pickRandom(now: number): void {
    const seat = this.current()
    const own = this.pings.get(seat)
    if (own !== undefined && this.pick(seat, own, now)) {
      return
    }
    const drafter = this.seats[seat]
    const spots = this.choices(seat)
    const unpinged = drafter === undefined ? spots : spots.filter((spot) =>
      this.pingersOf(spot, drafter.team).every((pinger) => pinger === drafter))
    const from = unpinged.length > 0 ? unpinged : spots
    const spot = from[Math.floor(Math.random() * from.length)]
    if (spot === undefined || !this.pick(seat, spot, now)) {
      // No allowed pick is left: the pool ran dry, so the turn passes.
      this.next(now)
    }
  }

  markReady(seatIndex: number, now: number): void {
    this.ready.add(seatIndex)
    this.startIfReady(now)
  }

  startIfReady(now: number): void {
    if (this.phase === Phase.Preview && this.seats.every((s, i) => s.bot || s.away || this.ready.has(i))) {
      this.start(now)
    }
  }

  start(now: number): void {
    this.phase = Phase.Picking
    this.turn = -1
    this.next(now)
  }

  private turnSeconds(): number {
    const seat = this.seats[this.current()]
    return seat.bot || seat.away ? BOT_SECONDS : PICK_SECONDS
  }

  private next(now: number): void {
    this.turn++
    if (this.turn >= this.order.length) {
      this.phase = Phase.Done
      return
    }
    this.deadline = now + this.turnSeconds()
  }

  /** Marks the seat away, so the draft picks for it. */
  leave(slot: number, now: number): void {
    const index = this.seatIndexOf(slot)
    const seat = this.seats[index]
    if (seat === undefined || seat.away) {
      return
    }
    seat.away = true
    this.ready.delete(index)
    if (index === this.current()) {
      this.deadline = Math.min(this.deadline, now + BOT_SECONDS)
    }
    this.startIfReady(now)
  }

  /** Gives a returning player their seat back, with a full turn if it is theirs. */
  rejoin(slot: number, now: number): void {
    const index = this.seatIndexOf(slot)
    const seat = this.seats[index]
    if (seat === undefined || !seat.away) {
      return
    }
    seat.away = false
    if (index === this.current()) {
      this.deadline = Math.max(this.deadline, now + PICK_SECONDS)
    }
  }
}

/**
 * An ultimate lands only on the ultimate's key, any other ability on the first
 * free regular key; -1 when there is none.
 */
function freeSlot(seat: Seat, column: AbilitySlot): number {
  const ultimate = column === AbilitySlot.Ultimate
  return seat.picks.findIndex((pick, slot) => pick === undefined && (slot === AbilitySlot.Ultimate) === ultimate)
}

/**
 * Seats pick as in Dota: the teams alternate, each team's seats in a shuffled
 * order, and every round runs the previous one backwards. A random team opens.
 */
function snakeOrder(seats: readonly Seat[]): number[] {
  const indexesOn = (team: Team) => seats.flatMap((seat, index) => (seat.team === team ? [index] : []))
  const hiddenKing = indexesOn(Team.HiddenKing)
  const archmother = indexesOn(Team.Archmother)
  const teams = Math.random() < 0.5 ? [hiddenKing, archmother] : [archmother, hiddenKing]
  const round: number[] = []
  for (let i = 0; i < Math.max(hiddenKing.length, archmother.length); i++) {
    for (const team of teams) {
      if (i < team.length) {
        round.push(team[i])
      }
    }
  }
  const order: number[] = []
  for (let r = 0; r < PICKS_PER_SEAT; r++) {
    order.push(...(r % 2 === 0 ? round : [...round].reverse()))
  }
  return order
}
