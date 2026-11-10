import { type Child, type Player, route, show } from 'modlock'

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
  Picker = 'picker',
  Hud = 'hud',
  Tab = 'tab',
  Mine = 'mine',
  Buy = 'buy',
  Upgrade = 'upgrade',
  TipSlots = 'tipSlots',
  Over = 'over',
}

/**
 * By ability game name, the slot whose hero the game's ability window reads
 * for the draft board: the tooltips' helper for the ability's hero. Undefined
 * clears it after the picks.
 */
export function routeTipSlots(player: Player, slots: Readonly<Record<string, number>> | undefined): void {
  route(player, Route.TipSlots, slots)
}

/** An item the person's game buys with the game's own command; order tells each purchase apart. */
interface Buy {
  readonly order: number
  readonly item: string
  readonly source: number
}

export function routeBuy(player: Player, buy: Buy): void {
  route(player, Route.Buy, buy)
}

export function forgetBuy(player: Player): void {
  route(player, Route.Buy, undefined)
}

/**
 * Abilities the person's game buys, each an order and how: upgrade_ability and
 * its number, or in_ability and the key, pressed with Tab held. The order tells
 * each purchase apart.
 */
export function routeUpgrades(player: Player, upgrades: readonly (readonly [number, string])[]): void {
  route(player, Route.Upgrade, upgrades)
}

export function forgetUpgrades(player: Player): void {
  route(player, Route.Upgrade, undefined)
}

export function hidePicker(player: Player): void {
  route(player, Route.Picker, true)
}

export function showPicker(player: Player): void {
  route(player, Route.Picker, false)
}

/**
 * The client layout does it because stock hideHud brings a panel back only once
 * the game lays the HUD out anew, as Tab does.
 */
export function hideGameHud(player: Player): void {
  route(player, Route.Hud, true)
}

export function showGameHud(player: Player): void {
  route(player, Route.Hud, false)
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
 * Once the match is over the client layout gives the game's HUD back: the
 * game's own lobby shows the same HUD, where the layout no longer runs.
 */
export function routeOver(player: Player): void {
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
