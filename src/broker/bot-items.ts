import { type Ability, item, log } from 'modlock'

import type { HeroRead } from '../match/roster'

/** The upgrade bit the game sets on a corrupted item. */
const CORRUPTED_BIT = 0x80

/** The game has corrupted forms only for its items from this tier up, the dearest. */
const LOWEST_CORRUPTIBLE_TIER = 3

function tierOf(ability: Ability): number {
  return item(ability.name)?.tier ?? 0
}

function isCorrupted(ability: Ability): boolean {
  return (ability.upgrades & CORRUPTED_BIT) !== 0
}

/** Each bot corrupts its dearest items until it holds limit corrupted ones, the limit a person has. */
export function corruptBotItems(heroes: readonly HeroRead[], limit: number): void {
  for (const { connection, owned } of heroes) {
    if (!connection.bot) {
      continue
    }
    const room = limit - owned.filter(isCorrupted).length
    const dearest = owned
      .filter((ability) => tierOf(ability) >= LOWEST_CORRUPTIBLE_TIER && !isCorrupted(ability))
      .sort((a, b) => tierOf(b) - tierOf(a))
    for (const ability of dearest.slice(0, Math.max(room, 0))) {
      const done = connection.player.setAbility({ ability: ability.name, upgrades: ability.upgrades | CORRUPTED_BIT })
      log(`broker: ${connection.name} corrupted ${ability.name}: ${done}`)
    }
  }
}
