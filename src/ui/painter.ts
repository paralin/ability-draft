import { freeCursor, type Player, players } from 'modlock'

import { type Draft, Phase } from '../draft/draft'
import { connectedPeople } from '../match/roster'
import { type DraftActions, drawDraft } from './board'
import { display, routeOver, showGameHud, showPicker } from './client'
import { drawLobby, type LobbyActions, type LobbyRoom } from './lobby'

const CLIENT_ONLY = 'client'
const OVER = 'over'

export class Painter {
  private readonly drawn = new Map<number, string>()
  private version = 0

  invalidate(): void {
    this.version++
  }

  private showIfChanged(slot: number, key: string, draw: () => void): void {
    if (this.drawn.get(slot) === key) {
      return
    }
    this.drawn.set(slot, key)
    draw()
  }

  /**
   * The timer stops counting once the picks end. tips names, by ability, the
   * player whose hero the game's ability window reads for the board's
   * tooltips; it grows as the helpers come, one a frame.
   */
  paintDraft(draft: Draft, now: number, actions: DraftActions, tips: Readonly<Record<string, Player>>): void {
    const secondsLeft = draft.secondsLeft(now)
    const helped = Object.keys(tips).length
    const key = `${this.version}:${draft.phase === Phase.Done ? '-' : secondsLeft}:${helped}`
    for (const c of connectedPeople()) {
      this.showIfChanged(c.player.slot, key, () => {
        // The board frees the mouse to click its abilities; a hidden screen,
        // as after a reconnect, forgets it, so every draw asks again.
        freeCursor(c.player, true)
        drawDraft(c.player, draft, { secondsLeft, tips, ...actions })
      })
    }
  }

  /**
   * Pressed with the mouse, since the chat of a person without a team may not
   * reach the mod; a freed cursor also stops the mouse turning the camera.
   */
  paintLobby(room: LobbyRoom, actions: LobbyActions): void {
    const { connections, ...shown } = room
    // Listed by hand: steamId is a bigint, which JSON.stringify refuses.
    const state = JSON.stringify([
      shown.people.map((p) => [p.slot, p.name, p.team, p.ready]),
      shown.bots,
      shown.startsIn,
      shown.broker,
    ])
    const view = { ...shown, ...actions }
    for (const c of connections) {
      this.showIfChanged(c.player.slot, `lobby:${state}`, () => {
        freeCursor(c.player, true)
        drawLobby(c.player, view)
      })
    }
  }

  paintPlaying(): void {
    for (const c of connectedPeople()) {
      this.showIfChanged(c.player.slot, CLIENT_ONLY, () => display(c.player, null))
    }
  }

  /** Once the match is over, the client layout gives each person the game's HUD back. */
  paintOver(): void {
    for (const c of connectedPeople()) {
      this.showIfChanged(c.player.slot, OVER, () => {
        routeOver(c.player)
        display(c.player, null)
      })
    }
  }

  /**
   * Gives every person the mouse, the game's HUD and its team picker back. A
   * screen with only the client layout clears the board: the game drops the empty
   * screen hide leaves, which kept the board up through the match, and the layout
   * stays for the Tab screen and the ability bar.
   */
  releaseScreens(): void {
    for (const c of players()) {
      if (!c.bot) {
        freeCursor(c.player, false)
        showGameHud(c.player)
        showPicker(c.player)
        display(c.player, null)
        this.drawn.set(c.player.slot, CLIENT_ONLY)
      }
    }
  }

  forget(slot: number): void {
    this.drawn.delete(slot)
  }

  clear(): void {
    this.drawn.clear()
  }
}
