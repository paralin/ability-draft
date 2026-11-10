import { type Player, players } from 'modlock'

import { clientCommand } from './command'

/**
 * A sound the server plays in players' games: its files in the game, one of
 * which plays at random each time. A game plays for the server a file and not
 * a sound event, so it plays at the file's own volume and pitch, and to its end.
 */
export interface GameSound {
  readonly files: readonly string[]
}

/**
 * The sound of the game's interface files name_01 to name_NN, variants of
 * them, or of the one file name without variants.
 */
export function uiSound(name: string, variants = 0): GameSound {
  const names = variants > 0
    ? Array.from({ length: variants }, (_, i) => `${name}_${String(i + 1).padStart(2, '0')}`)
    : [name]
  return { files: names.map((each) => `sounds/ui/${each}.vsnd`) }
}

/** Once in player's game, for them alone. False while the game has given them no pawn. */
export function playSound(player: Player, sound: GameSound): boolean {
  const file = sound.files[Math.floor(Math.random() * sound.files.length)]
  return file !== undefined && clientCommand(player, `play ${file}`)
}

/** Once in the game of each person who has finished joining. */
export function playSoundToAll(sound: GameSound): void {
  for (const c of players()) {
    if (c.ready && !c.bot) {
      playSound(c.player, sound)
    }
  }
}
