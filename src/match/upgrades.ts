import { log, type Player } from 'modlock'

import { ABILITY_SLOTS } from '../draft/slots'

/**
 * Trains or upgrades a drafted ability for the game's own commands, which the
 * mod claims: the game looks up the hero's own ability for a slot, so it would
 * buy the wrong one. Modlock's trainAbility runs the game's own upgrade on
 * the ability the hero holds there, charging the unlock or the points.
 */
export class KeyUpgrades {
  /** Takes the arguments of trainorupgradeability, the key's number from 1, or of upgrade_ability, the slot's from 0. */
  request(player: Player, args: string, first: number): void {
    const slot = ABILITY_SLOTS.find((each) => /^\d+$/.test(args) && each === Number(args) - first)
    if (slot === undefined) {
      return
    }
    const trained = player.trainAbility(slot)
    log(`upgrade: key ${slot} of player ${player.slot}: ${trained ? 'trained' : 'refused'}`)
  }
}
