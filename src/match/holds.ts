import { holdMatchClock, holdModifierState, matchClock, type Pawn, Player } from 'modlock'
import { apply } from 'modlock/console'

import type { Seat } from '../draft/draft'
import { playerAt } from './roster'

/**
 * A person's hero waits with every button blocked: the server sees no key and
 * the hero stands. The seats' bots join only once the match runs, so no bot's
 * hero is held.
 */
const EVERY_BUTTON = (1n << 64n) - 1n
const NO_BUTTON = 0n

/**
 * Keep a waiting hero safe and still while blocked: no damage, and no movement
 * the player's game would predict from the blocked keys.
 */
const HELD_STATES: readonly string[] = ['MODIFIER_STATE_INVULNERABLE', 'MODIFIER_STATE_MOVEMENT_INPUT_DISABLED']

function liftStates(entity: number): void {
  for (const state of HELD_STATES) {
    holdModifierState(entity, state, false)
  }
}

export class MatchHold {
  private clockHeld = false
  private spawnsHeld = false

  /**
   * The match's timings start once the heroes take the field. matchClock has
   * nothing until the world has a clock, so this is called every frame.
   */
  hold(): void {
    if (!this.clockHeld) {
      const clock = matchClock()
      if (clock !== undefined) {
        this.clockHeld = true
        holdMatchClock(clock)
      }
    }
    if (!this.spawnsHeld) {
      // The lanes' and camps' units stay back; true is the game's own value.
      apply({ citadel_trooper_spawn_enabled: false, citadel_neutral_spawn_enabled: false })
      this.spawnsHeld = true
    }
  }

  release(): void {
    if (this.clockHeld) {
      holdMatchClock()
      this.clockHeld = false
    }
    if (this.spawnsHeld) {
      apply({ citadel_trooper_spawn_enabled: true, citadel_neutral_spawn_enabled: true })
      this.spawnsHeld = false
    }
  }
}

export class HeroHold {
  /** By slot. */
  private readonly heldPawns = new Map<number, Pawn>()

  /** Again whenever the seat's hero entity or hero changes, as a drafted hero replaces the one it had. */
  holdSeats(seats: readonly Seat[]): void {
    for (const seat of seats) {
      const player = playerAt(seat.slot)
      const pawn = player?.pawn()
      if (player === undefined || pawn === undefined || pawn.health <= 0) {
        continue
      }
      // A player who joined again in the slot lost their block, so the
      // connection counts too.
      const last = this.heldPawns.get(seat.slot)
      if (last?.entity === pawn.entity && last.hero === pawn.hero && last.generation === pawn.generation) {
        continue
      }
      if (player.blockInput(EVERY_BUTTON)) {
        for (const state of HELD_STATES) {
          holdModifierState(pawn.entity, state, true)
        }
        this.heldPawns.set(seat.slot, pawn)
      }
    }
  }

  letGo(player: Player): void {
    const held = this.heldPawns.get(player.slot)
    player.blockInput(NO_BUTTON)
    if (held !== undefined) {
      liftStates(held.entity)
    }
    this.heldPawns.delete(player.slot)
  }

  /** A drafter who left keeps the holds on their hero, which outlives them. */
  releaseLeftovers(): void {
    for (const held of this.heldPawns.values()) {
      liftStates(held.entity)
    }
    this.heldPawns.clear()
  }

  /** Lifts the input blocks, which a world change keeps, and forgets every hold. */
  reset(): void {
    for (const slot of this.heldPawns.keys()) {
      Player.of(slot).blockInput(NO_BUTTON)
    }
    this.heldPawns.clear()
  }
}
