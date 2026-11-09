import { log, type Player } from 'modlock'

import { ABILITY_SLOTS } from '../draft/slots'
import { forgetUpgrades, routeUpgrades } from '../ui/client'

/** How long an upgrade stays on the route, for the person's game to read it once. */
const ROUTE_SECONDS = 1

interface Sent {
  readonly order: number
  /** in_ability and the key, pressed with Tab held. */
  readonly line: string
  readonly at: number
}

interface Person {
  readonly player: Player
  sent: readonly Sent[]
}

/** How the person's game buys the ability in slot: its key, pressed with Tab held; undefined where the slot is empty. */
function purchaseOf(player: Player, slot: number): string | undefined {
  return player.abilities().some((a) => a.slot === slot) ? `in_ability${slot + 1}` : undefined
}

export class KeyUpgrades {
  /** By the person's slot. */
  private readonly people = new Map<number, Person>()
  private nextOrder = 1

  /** Takes the arguments of trainorupgradeability, the key's number from 1, or of upgrade_ability, the slot's from 0. */
  request(player: Player, args: string, now: number, first: number): void {
    const slot = ABILITY_SLOTS.find((each) => /^\d+$/.test(args) && each === Number(args) - first)
    if (slot === undefined) {
      return
    }
    const line = purchaseOf(player, slot)
    log(`upgrade: key ${slot} of player ${player.slot}: ${line ?? 'nothing there'}`)
    if (line === undefined) {
      return
    }
    const person = this.people.get(player.slot) ?? { player, sent: [] }
    person.sent = [...person.sent, { order: this.nextOrder++, line, at: now }]
    this.people.set(player.slot, person)
    routeUpgrades(player, person.sent.map((each) => [each.order, each.line]))
  }

  /** Takes each upgrade off its route once the person's game has had time to read it. */
  follow(now: number): void {
    for (const [slot, person] of this.people) {
      const kept = person.sent.filter((each) => now - each.at < ROUTE_SECONDS)
      if (kept.length === person.sent.length) {
        continue
      }
      person.sent = kept
      if (kept.length === 0) {
        this.people.delete(slot)
        forgetUpgrades(person.player)
      } else {
        routeUpgrades(person.player, kept.map((each) => [each.order, each.line]))
      }
    }
  }

  clear(): void {
    this.people.clear()
  }
}
