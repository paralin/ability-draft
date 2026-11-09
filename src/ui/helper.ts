import { addBot, type EntityPlacement, entityPosition, log, moveEntity, type Player, players, readField, type Vector, writeField } from 'modlock'

import type { PoolHero } from '../draft/pool'
import { Team } from '../draft/teams'
import { SPOTS } from '../lobby/camera'

/** Where the helpers stand, in turn: each team's view of the lobby. */
const PLACES: readonly EntityPlacement[] = [SPOTS[Team.HiddenKing], SPOTS[Team.Archmother]]

/** A helper the game refused is asked for again this much later. */
const RETRY_SECONDS = 1

/**
 * A helper whose hero has not stood this long after it was added is removed,
 * and its hero waits for another, up to TRIES helpers in all.
 */
const STAND_SECONDS = 10

const TRIES = 3

/** CBaseEntity's m_fEffects flag that keeps an entity from drawing. */
const EF_NODRAW = 0x20

/** How far, in units, a helper's hero may stand from its place before it is moved back. */
const STRAY = 64

/** How many of a helper's moves back are logged, with where it stood. */
const LOGGED_MOVES = 3

interface Helper {
  readonly hero: PoolHero
  readonly bot: Player
  /** The team view it stands at. */
  readonly place: EntityPlacement
  /** The game keeps one bot to a name, so the name tells this helper from whoever takes its slot after it. */
  readonly name: string
  /** In seconds. */
  readonly addedAt: number
  /** Once the game lists it among the players, after which its leaving counts. */
  seen: boolean
  /** Moved to team 3 once its hero stood, after which its window works. */
  ready: boolean
  /** Times its hero was moved back to its place. */
  moves: number
}

export class TooltipHelpers {
  private waiting: PoolHero[] = []
  private readonly helpers: Helper[] = []
  /** Helpers asked for so far, which numbers their names. */
  private made = 0
  /** By hero name, the helpers added for it so far. */
  private readonly tries = new Map<string, number>()
  /** Helpers removed whose players the game may still list. */
  private leaving: { readonly slot: number; readonly name: string }[] = []
  private retryAt = 0
  /** Whether the game refused the last helper asked for, which is logged once. */
  private refused = false
  /** Index of the helper whose hero keepNextAside looks at next. */
  private nextAside = 0

  /** The heroes to add helpers for, one a frame from the next frame on. */
  start(heroes: readonly PoolHero[]): void {
    this.waiting = [...heroes]
  }

  /** Moves the newest helper once its hero stands, else adds the next. */
  frame(now: number): void {
    this.forgetGone()
    this.keepNextAside()
    const newest = this.helpers[this.helpers.length - 1]
    if (newest !== undefined && !newest.ready) {
      const pawn = newest.bot.pawn()
      if (pawn !== undefined) {
        // It stands in a team's view, so it hides and goes there at once
        // rather than in turn.
        keepAside(newest, pawn.entity)
        newest.ready = newest.bot.changeTeam(Team.Archmother)
        if (!newest.ready) {
          log(`draft: tooltip helper for ${newest.hero.name} did not move to team 3`)
          this.helpers.pop()
          newest.bot.removeBot()
        }
      } else if (now - newest.addedAt > STAND_SECONDS) {
        const tried = this.tries.get(newest.hero.name) ?? 0
        log(`draft: tooltip helper for ${newest.hero.name} did not stand in ${STAND_SECONDS} s, try ${tried} of ${TRIES}`)
        this.helpers.pop()
        newest.bot.removeBot()
        if (tried < TRIES) {
          this.waiting.push(newest.hero)
        }
      }
      return
    }
    const hero = this.waiting[0]
    if (hero === undefined || now < this.retryAt) {
      return
    }
    const name = `Ability Draft ${this.made + 1}`
    const place = PLACES[this.made % PLACES.length]
    const bot = addBot({ name, team: Team.HiddenKing, hero: hero.name, position: place.position })
    if (bot === undefined) {
      if (!this.refused) {
        log(`draft: the game refused a tooltip helper for ${hero.name}; asking again every ${RETRY_SECONDS} s`)
      }
      this.refused = true
      this.retryAt = now + RETRY_SECONDS
      return
    }
    this.made++
    this.tries.set(hero.name, (this.tries.get(hero.name) ?? 0) + 1)
    this.waiting.shift()
    this.refused = false
    this.helpers.push({ hero, bot, place, name, addedAt: now, seen: false, ready: false, moves: 0 })
  }

  /**
   * Keeps one helper's hero a frame hidden and at its place, in turn: the game
   * clears EF_NODRAW and puts the hero back at its spawn as a hero spawns.
   */
  private keepNextAside(): void {
    if (this.helpers.length === 0) {
      return
    }
    this.nextAside %= this.helpers.length
    const helper = this.helpers[this.nextAside]
    const entity = helper.bot.pawn()?.entity
    this.nextAside++
    if (entity !== undefined) {
      keepAside(helper, entity)
    }
  }

  /**
   * A helper gone from its slot, as one kicked, is forgotten, so that whoever
   * takes the slot after it counts as a player and stays at the end; its hero
   * waits for a new one.
   */
  private forgetGone(): void {
    const here = new Map(players().map((c) => [c.player.slot, c]))
    for (const helper of [...this.helpers]) {
      const c = here.get(helper.bot.slot)
      if (c !== undefined && c.bot && c.name === helper.name) {
        helper.seen = true
      } else if (helper.seen) {
        log(`draft: tooltip helper for ${helper.hero.name} left`)
        this.helpers.splice(this.helpers.indexOf(helper), 1)
        this.waiting.push(helper.hero)
      }
    }
  }

  /** Whether slot is a helper's, which no count of players or heroes takes in. */
  holds(slot: number): boolean {
    return this.helpers.some(({ bot }) => bot.slot === slot)
  }

  /**
   * By ability game name, its hero's helper, for the helpers ready and still
   * here: the game's ability window reads the numbers off the helper's hero.
   */
  tips(): Readonly<Record<string, Player>> {
    const tips: Record<string, Player> = {}
    for (const { hero, bot, seen, ready } of this.helpers) {
      if (seen && ready) {
        for (const ability of hero.abilities) {
          tips[ability.name] = bot
        }
      }
    }
    return tips
  }

  /** Removes the helpers still in their slots. */
  remove(): void {
    this.forgetGone()
    for (const { bot } of this.helpers) {
      bot.removeBot()
    }
    const leaving = this.helpers.map(({ bot, name }) => ({ slot: bot.slot, name }))
    this.forget()
    this.leaving = leaving
  }

  /**
   * Whether the helpers removed have left: until then they still fill team 3,
   * where the game makes no bot while it holds six players.
   */
  gone(): boolean {
    const here = new Map(players().map((c) => [c.player.slot, c]))
    this.leaving = this.leaving.filter(({ slot, name }) => {
      const c = here.get(slot)
      return c !== undefined && c.bot && c.name === name
    })
    return this.leaving.length === 0
  }

  /** The world took the bots with it. */
  forget(): void {
    this.waiting = []
    this.helpers.length = 0
    this.leaving = []
    this.made = 0
    this.tries.clear()
    this.retryAt = 0
    this.refused = false
  }
}

/** Hides the helper's hero and holds it at its place, logging its first moves back with where it stood. */
function keepAside(helper: Helper, entity: number): void {
  hide(entity)
  const at = entityPosition(entity)?.position
  const { position, facing } = helper.place
  if (at === undefined || Math.hypot(at.x - position.x, at.y - position.y, at.z - position.z) <= STRAY) {
    return
  }
  helper.moves++
  const moved = moveEntity(entity, position, facing) && helper.bot.freeze(true)
  if (helper.moves <= LOGGED_MOVES) {
    log(`draft: tooltip helper for ${helper.hero.name} stood at ${where(at)}; ${moved ? 'moved' : 'could not move'} to ${where(position)}`)
  }
}

function where({ x, y, z }: Vector): string {
  return `${Math.round(x)} ${Math.round(y)} ${Math.round(z)}`
}

/** Sets EF_NODRAW on the entity unless it has it. */
function hide(entity: number): void {
  const effects = Number(readField(entity, 'CBaseEntity', 'm_fEffects', 'uint32') ?? 0)
  if ((effects & EF_NODRAW) === 0) {
    writeField(entity, 'CBaseEntity', 'm_fEffects', 'uint32', effects | EF_NODRAW)
  }
}
