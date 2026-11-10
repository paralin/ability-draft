import { createEntity, findEntities, fireInput, type Player, readField } from 'modlock'

/** The map entity that runs a console command in the game of whoever activates it. */
const COMMAND_ENTITY = 'point_clientcommand'
const COMMAND_INPUT = 'Command'
const NEUTRAL_TEAM = 4
const HANDLE_INDEX_MASK = 0x7fff

let entity: number | undefined

/** The pawn a player without a hero is; a slot's controller is the entity at index slot + 1. */
function observerOf(slot: number): number | undefined {
  return findEntities('observer').find((pawn) => {
    const controller = readField(pawn, 'CBasePlayerPawn', 'm_hController', 'handle')
    return typeof controller === 'number' && (controller & HANDLE_INDEX_MASK) === slot + 1
  })
}

function send(line: string, pawn: number): boolean {
  return entity !== undefined && fireInput(entity, COMMAND_INPUT, { text: line }, pawn)
}

/**
 * Runs line in player's game console, as if they typed it. A game runs for
 * the server only the few commands it allows it, such as play, and refuses the
 * rest with a line in its own console. False while the game has given the
 * player no pawn, as before they finish loading.
 */
export function clientCommand(player: Player, line: string): boolean {
  // The command goes to the player whose pawn activates the entity: their
  // hero, or the observer they are without one. Their controller gets none.
  const pawn = player.pawn()?.entity ?? observerOf(player.slot)
  if (pawn === undefined) {
    return false
  }
  if (send(line, pawn)) {
    return true
  }
  // None was made yet, or the world took it with it.
  entity = createEntity({ designerName: COMMAND_ENTITY, subclass: '', team: NEUTRAL_TEAM, position: { x: 0, y: 0, z: 0 } })
  return send(line, pawn)
}
