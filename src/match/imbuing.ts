import { item, log, type Player } from 'modlock'

import { ABILITY_SLOTS } from '../draft/slots'

/**
 * Buys an imbuing item for the game's own buydependentitem, which the mod
 * claims: the game looks up the hero's own ability for the slot, so it refuses
 * a drafted one. Modlock's buyItem sells it under the shop's rules, charging
 * the souls, and imbues whatever ability the hero holds in that slot.
 */
export class ImbuingPurchases {
  /** Takes the arguments of buydependentitem: the item, the ability's slot and the purchase's source. */
  request(player: Player, args: string): void {
    const [name = '', slot, sourceText] = args.split(/\s+/)
    const ability = ABILITY_SLOTS.find((each) => each === Number(slot))
    const source = Number(sourceText)
    if (ability === undefined || !Number.isInteger(source) || source < 0 || !item(name)?.imbue) {
      return
    }
    const bought = player.buyItem(name, ability, source)
    log(`shop: ${name} on slot ${ability} of player ${player.slot}: ${bought ? 'bought' : 'refused'}`)
  }
}
