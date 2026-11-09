import { item, log, type Player } from 'modlock'

import { ABILITY_SLOTS, type AbilitySlot } from '../draft/slots'
import { forgetBuy, routeBuy } from '../ui/client'
import type { HeroRead } from './roster'

/** A refused purchase sends no word back, so it is forgotten after this long. */
const BUY_WAIT_SECONDS = 3

interface Purchase {
  readonly item: string
  readonly ability: AbilitySlot
  readonly until: number
}

export class ImbuingPurchases {
  /** By the buyer's slot. */
  private readonly pending = new Map<number, Purchase>()
  private nextOrder = 1

  /** Takes the arguments of buydependentitem: the item, the ability's slot and the purchase's source. */
  request(player: Player, args: string, now: number): void {
    const [name = '', slot, sourceText] = args.split(/\s+/)
    const ability = ABILITY_SLOTS.find((each) => each === Number(slot))
    const source = Number(sourceText)
    if (ability === undefined || !Number.isInteger(source) || !item(name)?.imbue) {
      return
    }
    if (player.abilities().some((owned) => owned.name === name)) {
      return
    }
    this.pending.set(player.slot, { item: name, ability, until: now + BUY_WAIT_SECONDS })
    routeBuy(player, { order: this.nextOrder++, item: name, source })
  }

  /** Puts each item the game has sold on its chosen ability. */
  follow(heroes: readonly HeroRead[], now: number): void {
    for (const { connection: { player }, owned } of heroes) {
      const purchase = this.pending.get(player.slot)
      if (purchase === undefined) {
        continue
      }
      const bought = owned.some((each) => each.name === purchase.item)
      if (!bought && now < purchase.until) {
        continue
      }
      this.pending.delete(player.slot)
      forgetBuy(player)
      if (bought) {
        log(`shop: ${purchase.item} on slot ${purchase.ability} of player ${player.slot}: ${player.giveItem(purchase.item, purchase.ability)}`)
      }
    }
  }

  clear(): void {
    this.pending.clear()
  }
}
