import type { Player } from 'modlock'

import { type Draft, Phase } from '../draft/draft'
import { connectedPeople, playerAt } from '../match/roster'
import { type Played, routeSounds } from './client'
import { COUNTDOWN_SECONDS, SCROLL_SECONDS, Sound } from './sounds'

/** The sounds a route carries: those the game may not have read yet. */
const SOUNDS_KEPT = 8

export class Cues {
  private heardPicks = 0
  private heardTurn = -1
  /** As turn:second. */
  private ticked = ''
  private readonly playedBySlot = new Map<number, Played[]>()
  private nextSound = 1

  start(): void {
    this.heardPicks = 0
    this.heardTurn = -1
    this.ticked = ''
    this.toAll(Sound.Start)
  }

  end(): void {
    this.toAll(Sound.End)
  }

  refuse(player: Player): void {
    this.play(player, Sound.Refuse)
  }

  follow(draft: Draft, now: number): void {
    this.playPicks(draft)
    if (draft.phase !== Phase.Picking) {
      return
    }
    const seat = draft.currentSeat()
    const drafter = seat === undefined || seat.bot || seat.away ? undefined : playerAt(seat.slot)
    this.playTurnStart(draft.turn, drafter)
    this.playCountdown(draft, now, drafter)
  }

  forget(slot: number): void {
    this.playedBySlot.delete(slot)
  }

  private playPicks(draft: Draft): void {
    for (const taken of draft.history.slice(this.heardPicks)) {
      const seat = draft.seats[taken.seat]
      const picker = seat === undefined || seat.bot ? undefined : playerAt(seat.slot)
      if (picker !== undefined) {
        this.play(picker, taken.hero !== undefined ? Sound.OwnHero : Sound.OwnAbility)
      }
    }
    this.heardPicks = draft.history.length
  }

  private playTurnStart(turn: number, drafter: Player | undefined): void {
    if (turn === this.heardTurn) {
      return
    }
    // The first turn opens the picks; each later one scrolls the order.
    if (this.heardTurn >= 0) {
      this.toAll(Sound.Scroll, SCROLL_SECONDS)
    }
    this.heardTurn = turn
    if (drafter !== undefined) {
      this.play(drafter, Sound.YourTurn)
    }
  }

  private playCountdown(draft: Draft, now: number, drafter: Player | undefined): void {
    const left = draft.secondsLeft(now)
    const tick = `${draft.turn}:${left}`
    if (drafter !== undefined && left >= 1 && left <= COUNTDOWN_SECONDS && this.ticked !== tick) {
      this.ticked = tick
      this.play(drafter, Sound.Tick)
    }
  }

  private toAll(sound: Sound, seconds?: number): void {
    for (const c of connectedPeople()) {
      this.play(c.player, sound, seconds)
    }
  }

  /** Once in player's game, for them alone; cut after seconds when they are given, to keep only its start. */
  private play(player: Player, sound: Sound, seconds?: number): void {
    const newest = { n: this.nextSound++, s: sound, t: seconds ?? 0 }
    const played = [...(this.playedBySlot.get(player.slot) ?? []), newest].slice(-SOUNDS_KEPT)
    this.playedBySlot.set(player.slot, played)
    routeSounds(player, played)
  }
}
