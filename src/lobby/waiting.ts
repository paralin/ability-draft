import { type Connection, type EntityPlacement, entityPosition, log, moveEntity } from 'modlock'

import type { Team } from '../draft/teams'
import { hideGameHud, hidePicker } from '../ui/client'
import { observerOf, SPOTS } from './camera'

const VIEW_SECONDS = 1

interface HeldView {
  readonly generation: number
  readonly team: Team
  readonly at: number
  readonly observer: number | undefined
  /** Where the game kept the observer, noted before its first move, to put it back after the draft. */
  readonly home: EntityPlacement | undefined
}

export class WaitView {
  /** The connection the game's UI is hidden for, by slot. */
  private readonly uiHiddenFor = new Map<number, number>()
  private readonly held = new Map<number, HeldView>()

  show(c: Connection, team: Team, now: number): void {
    this.hideGameUi(c)
    this.holdView(c, team, now)
  }

  /** One with no seat keeps the view the game gave them, without its team picker. */
  showSeatless(c: Connection): void {
    this.hideGameUi(c)
  }

  /**
   * The game's team picker stays hidden until the match begins, and its whole
   * HUD until the last pick; the client layout hides both.
   */
  private hideGameUi(c: Connection): void {
    const slot = c.player.slot
    if (this.uiHiddenFor.get(slot) !== c.generation) {
      hideGameHud(c.player)
      hidePicker(c.player)
      this.uiHiddenFor.set(slot, c.generation)
    }
  }

  /**
   * Moves the observer pawn the person sees the map through to their team's
   * spot, at once on a new team and again every VIEW_SECONDS, in case the game
   * put it back.
   */
  private holdView(c: Connection, team: Team, now: number): void {
    const slot = c.player.slot
    const last = this.held.get(slot)
    const known = last?.generation === c.generation ? last : undefined
    if (known?.team === team && now - known.at < VIEW_SECONDS) {
      return
    }
    // Finding the observer walks every entity, which stalls the server, so
    // the one found is kept for the connection and sought again only when
    // moving it fails.
    const spot = SPOTS[team]
    const moveTo = (entity: number | undefined) =>
      entity !== undefined && moveEntity(entity, spot.position, spot.facing)
    let observer = known?.observer
    let home = known?.home
    let moved = moveTo(observer)
    if (!moved) {
      const found = observerOf(slot)
      if (found !== undefined && found !== observer) {
        home = entityPosition(found)
      }
      observer = found
      moved = moveTo(observer)
    }
    if (moved && known?.team !== team) {
      log(`draft: player ${slot} sees team ${team}'s spot`)
    }
    this.held.set(slot, { generation: c.generation, team, at: now, observer: moved ? observer : undefined, home })
  }

  /**
   * Every observer the draft moved goes back where the game kept it: the game
   * takes a person's observer up again as their hero dies, and the server
   * crashed as such a hero respawned, the game moving a body with no model.
   * Painter's releaseScreens shows the hidden pickers again.
   */
  restore(): void {
    for (const [slot, view] of this.held) {
      if (view.observer !== undefined && view.home !== undefined) {
        const { position, facing } = view.home
        const back = moveEntity(view.observer, position, facing)
        const where = `${Math.round(position.x)} ${Math.round(position.y)} ${Math.round(position.z)}`
        log(`draft: observer of player ${slot} ${back ? 'back' : 'not back'} at ${where}`)
      }
    }
    this.clear()
  }

  clear(): void {
    this.uiHiddenFor.clear()
    this.held.clear()
  }
}
