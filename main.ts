import { command, onFrame, onStart, onWorld, precache } from 'modlock'

import { switchOnBroker } from './src/broker/broker'
import { poolHeroes } from './src/draft/pool'
import { Flow } from './src/flow'

const flow = new Flow()

// Every hero's abilities may land on any hero, so the world loads them all.
onStart(() => {
  precache({ heroes: poolHeroes.map((h) => h.name) })
  switchOnBroker()
})

onWorld(() => flow.resetForWorld())
onFrame((frame) => flow.frame(frame.timeSeconds))

// The game's own hero picker sends selecthero; the mod answers it, so that
// nobody leaves the hero the draft gave them or takes one after the draft.
command('selecthero', (player) => flow.heroCommand(player))

// The game's own command for an item that strengthens an ability buys nothing
// for a drafted hero; the mod buys it through the shop for the drafted ability.
command('buydependentitem', (player, args) => flow.buyImbuingItem(player, args))

// Alt with an ability's key sends the first, a click on the ability bar the
// second, and a click on it with Tab held the third or, by the ability's name,
// the fourth; the game would buy the hero's ability for that place by default,
// which for a drafted hero may sit in another, or in the field only start
// learning it, or buy nothing for another hero's ability.
command('trainorupgradeability', (player, args) => flow.upgradeByKey(player, args))
command('upgrade_ability', (player, args) => flow.upgradeBySlot(player, args))
command('upgrade_ability_in_field', (player, args) => flow.upgradeBySlot(player, args))
command('trainability', (player, args) => flow.upgradeByName(player, args))
