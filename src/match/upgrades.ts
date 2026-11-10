import { log, type Player } from 'modlock'

import { ABILITY_SLOTS, type AbilitySlot } from '../draft/slots'

/**
 * One click on the ability bar may reach the mod twice: as Modlock's bar press
 * and as the game's own command, when the game finds an ability of the hero's
 * for the slot. Two from different ways within this long are the same click.
 */
const SAME_CLICK_SECONDS = 0.5

/** How a request to train reached the mod. */
type Way = 'bar' | 'command'

/** The last training sent for a player's slot, and whether a second way has answered for it. */
interface Sent {
  readonly slot: AbilitySlot
  readonly way: Way
  readonly at: number
  paired: boolean
}

/**
 * Trains or upgrades a drafted ability for the game's own commands, which the
 * mod claims, and for clicks on the ability bar, which Modlock reports: the
 * game looks up the hero's own ability for a slot, so it would buy the wrong
 * one or nothing. Modlock's trainAbility runs the game's own upgrade on the
 * ability the hero holds there, charging the unlock or the points.
 */
export class KeyUpgrades {
  /** By the player's slot. */
  private readonly last = new Map<number, Sent>()

  /** Takes the arguments of trainorupgradeability, the key's number from 1, or of upgrade_ability, the slot's from 0. */
  request(player: Player, args: string, first: number, now: number): void {
    const slot = ABILITY_SLOTS.find((each) => /^\d+$/.test(args) && each === Number(args) - first)
    if (slot !== undefined) {
      this.train(player, slot, 'command', now)
    }
  }

  /** Takes a click on the ability bar in slot. */
  bar(player: Player, slot: number, now: number): void {
    const held = ABILITY_SLOTS.find((each) => each === slot)
    if (held !== undefined) {
      this.train(player, held, 'bar', now)
    }
  }

  forget(slot: number): void {
    this.last.delete(slot)
  }

  clear(): void {
    this.last.clear()
  }

  private train(player: Player, slot: AbilitySlot, way: Way, now: number): void {
    // The other way's word for the same click trains nothing more.
    const last = this.last.get(player.slot)
    if (last !== undefined && !last.paired && last.slot === slot && last.way !== way && now - last.at < SAME_CLICK_SECONDS) {
      last.paired = true
      return
    }
    this.last.set(player.slot, { slot, way, at: now, paired: false })
    const trained = player.trainAbility(slot)
    log(`upgrade: ${way} ${slot} of player ${player.slot}: ${trained ? 'trained' : 'refused'}`)
  }
}
