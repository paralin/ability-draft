import type { Player } from 'modlock'

import { type Draft, Phase } from '../draft/draft'
import { playerAt } from '../match/roster'
import { playSound, playSoundToAll } from '../sound/sound'
import { COUNTDOWN_SECONDS, Cue } from './sounds'

export class Cues {
  private heardPicks = 0
  private heardTurn = -1
  /** As turn:second. */
  private ticked = ''

  start(): void {
    this.heardPicks = 0
    this.heardTurn = -1
    this.ticked = ''
    playSoundToAll(Cue.Start)
  }

  end(): void {
    playSoundToAll(Cue.End)
  }

  refuse(player: Player): void {
    playSound(player, Cue.Refuse)
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

  private playPicks(draft: Draft): void {
    for (const taken of draft.history.slice(this.heardPicks)) {
      const seat = draft.seats[taken.seat]
      const picker = seat === undefined || seat.bot ? undefined : playerAt(seat.slot)
      if (picker !== undefined) {
        playSound(picker, taken.hero !== undefined ? Cue.OwnHero : Cue.OwnAbility)
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
      playSoundToAll(Cue.Scroll)
    }
    this.heardTurn = turn
    if (drafter !== undefined) {
      playSound(drafter, Cue.YourTurn)
    }
  }

  private playCountdown(draft: Draft, now: number, drafter: Player | undefined): void {
    const left = draft.secondsLeft(now)
    const tick = `${draft.turn}:${left}`
    if (drafter !== undefined && left >= 1 && left <= COUNTDOWN_SECONDS && this.ticked !== tick) {
      this.ticked = tick
      playSound(drafter, Cue.Tick)
    }
  }
}
