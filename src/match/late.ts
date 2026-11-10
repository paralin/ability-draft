import { type Connection, log } from 'modlock'

import { hidePicker } from '../ui/hud'
import { Word } from '../ui/text'

export class LateArrivals {
  /** The connection already sent to the spectators, by slot. */
  private readonly handled = new Map<number, number>()

  /** waiting: the people with no hero on a team and no seat from the draft. */
  follow(waiting: readonly Connection[]): void {
    for (const c of waiting) {
      const slot = c.player.slot
      if (this.handled.get(slot) === c.generation) {
        continue
      }
      this.handled.set(slot, c.generation)
      hidePicker(c.player)
      const watching = c.player.spectate()
      c.player.chat(Word.MatchStarted)
      log(`draft: ${c.name} arrived after the lobby and ${watching ? 'watches' : 'could not be made a spectator'}`)
    }
  }

  clear(): void {
    this.handled.clear()
  }
}
