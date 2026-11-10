import { type Child, hideHud, type HudPart, type Player, route, show } from 'modlock'

// One-letter keys because these are the routes' wire format: Tab's list carries
// every hero, about 3 KB of the 8192 bytes a route holds.

/**
 * Shows player root, as show does, with the client layout first, so it stays in
 * place and keeps running however the rest changes. A null root leaves the
 * layout alone on the screen.
 */
export function display(player: Player, root: Child): void {
  show(player, [<layout key="client" src="client.xml" style={{ width: 0, height: 0 }} />, root])
}

/** The routes content/scripts/client.js listens on. */
enum Route {
  Tab = 'tab',
  Mine = 'mine',
  Over = 'over',
}

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

export interface TabHero {
  /** The player's slot, whose hero the game's ability window reads for the row's tooltips. */
  readonly s: number
  /** The player's name, as the top bar shows it. */
  readonly n: string
  /** The hero's game name, such as hero_atlas, for a row whose name differs. */
  readonly h: string
  /**
   * The four abilities: game name, upgrade bits, bit 0 unlocked and bits 1 to
   * 3 upgrades, and icon; an empty name and icon for one outside the pool.
   */
  readonly a: readonly (readonly [string, number, string])[]
}

/**
 * Once the match is over the game's HUD comes back, the Broker's countdown
 * with it, and the client layout gives back Tab's and the bar's icons: the
 * game's own lobby shows the same HUD, where the layout no longer runs.
 */
export function routeOver(player: Player): void {
  setHidden(player, { over: true })
  route(player, Route.Over, true)
}

export function routeTab(player: Player, heroes: readonly TabHero[]): void {
  route(player, Route.Tab, heroes)
}

/** A person's own hero's four abilities in slot order, as their ability bar reads them. */
export interface Mine {
  /** Their upgrade bits, which the client layout lights on the game's ability bar. */
  readonly u: readonly number[]
  /** The ability points the player holds unspent, which decide the upgrades they can buy. */
  readonly p: number
  /** The ability unlocks the player holds unspent, which decide whether an ability can be unlocked. */
  readonly k: number
}

export function routeMine(player: Player, mine: Mine): void {
  route(player, Route.Mine, mine)
}
