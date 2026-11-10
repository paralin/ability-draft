import { abilityDisplay, type HudPart, hideHud, type Player } from 'modlock'

/**
 * What a person's game HUD hides: everything until the last pick, the team
 * picker until the match begins, and the Broker's countdown, which reads 34
 * days, until the match is over. Modlock gives it all back when they leave.
 */
interface Hidden {
  readonly all: boolean
  readonly picker: boolean
  readonly over: boolean
}

const SHOWN: Hidden = { all: false, picker: false, over: false }

const hidden = new Map<number, Hidden>()

function setHidden(player: Player, change: Partial<Hidden>): void {
  const next = { ...(hidden.get(player.slot) ?? SHOWN), ...change }
  hidden.set(player.slot, next)
  const parts: HudPart[] = []
  if (next.all) {
    parts.push('all')
  }
  if (next.picker) {
    parts.push('heroPicker')
  }
  if (!next.over) {
    parts.push('brokerCountdown')
  }
  hideHud(player, parts)
}

export function hidePicker(player: Player): void {
  setHidden(player, { picker: true })
}

export function showPicker(player: Player): void {
  setHidden(player, { picker: false })
}

export function hideGameHud(player: Player): void {
  setHidden(player, { all: true })
}

export function showGameHud(player: Player): void {
  setHidden(player, { all: false })
}

/** A person who left starts again with the game's whole HUD. */
export function forgetHidden(slot: number): void {
  hidden.delete(slot)
}

/** A new lobby starts every person again with the game's whole HUD. */
export function clearHidden(): void {
  hidden.clear()
}

/**
 * Once the match is over the game's HUD comes back, the Broker's countdown
 * with it, and so do the game's own abilities on Tab and the ability bar: the
 * game's own lobby shows the same HUD.
 */
export function showOverHud(player: Player): void {
  setHidden(player, { over: true })
  abilityDisplay(player)
}
