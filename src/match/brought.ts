import type { Player } from 'modlock'

import { AbilitySlot } from '../draft/slots'

const BROUGHT: ReadonlyMap<string, string> = new Map([
  ['ability_chessmaster_queen', 'ability_chessmaster_movechesspiece'],
  ['ability_artist_homingbrush', 'ability_artist_pullbrush'],
])

export function makeRoomFor(player: Player, abilityName: string): void {
  const brought = BROUGHT.get(abilityName)
  if (brought === undefined) {
    return
  }
  const held = player.abilities().find((a) => a.slot === AbilitySlot.Alternate)
  if (held !== undefined && held.name !== brought) {
    player.replaceAbility(AbilitySlot.Alternate, brought)
  }
}
