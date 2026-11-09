import { findEntities, log, type Player, readField, writeField } from 'modlock'

import type { Seat } from '../draft/draft'
import { Team } from '../draft/teams'
import { controllerOf, playerAt } from './roster'

/**
 * dl_midtown's lanes, as its barracks and ropes number them. The game's other
 * lane, green, is 3, and this map has none.
 */
enum Lane {
  Yellow = 1,
  Blue = 4,
  Purple = 6,
}

/** A tie for the emptiest lane goes to the earliest here. */
const LANES: readonly Lane[] = [Lane.Yellow, Lane.Blue, Lane.Purple]

/** EGameState's PreGameWait and GameInProgress. */
const PRE_GAME_WAIT = 6
const GAME_IN_PROGRESS = 7

function assignLane(player: Player, lane: Lane): boolean {
  const pawn = player.pawn()
  const controller = pawn === undefined ? undefined : controllerOf(pawn.entity)
  return controller !== undefined &&
    writeField(controller, 'CCitadelPlayerController', 'm_nAssignedLane', 'int8', lane) &&
    writeField(controller, 'CCitadelPlayerController', 'm_nOriginalLaneAssignment', 'int8', lane)
}

function emptiestLane(counts: ReadonlyMap<Lane, number>): Lane {
  return LANES.reduce((best, lane) => ((counts.get(lane) ?? 0) < (counts.get(best) ?? 0) ? lane : best))
}

/** Spreads each team's people over its lanes, two to a lane. */
function assignLanes(seats: readonly Seat[]): void {
  for (const team of [Team.HiddenKing, Team.Archmother]) {
    const counts = new Map<Lane, number>()
    for (const seat of seats.filter((s) => s.team === team && !s.bot)) {
      const player = playerAt(seat.slot)
      if (player === undefined) {
        continue
      }
      const lane = emptiestLane(counts)
      counts.set(lane, (counts.get(lane) ?? 0) + 1)
      log(`draft: player ${seat.slot} takes lane ${lane}`)
      if (!assignLane(player, lane)) {
        log(`draft: could not give player ${seat.slot} lane ${lane}`)
      }
    }
  }
}

/** Gives every person a lane, then has the game start its match again, which starts each hero on a rope. */
export function startOnRopes(seats: readonly Seat[]): void {
  assignLanes(seats)
  const rules = findEntities('citadel_gamerules')[0]
  const start = rules === undefined ? undefined : readField(rules, 'CCitadelGameRules', 'm_flGameStateStartTime', 'float32')
  const restarted = rules !== undefined && typeof start === 'number' &&
    writeField(rules, 'CCitadelGameRules', 'm_eGameState', 'uint32', PRE_GAME_WAIT) &&
    writeField(rules, 'CCitadelGameRules', 'm_flGameStateEndTime', 'float32', start)
  log(restarted ? 'draft: the game starts its match again, each hero on its rope' : 'draft: could not start the match again')
}

/** Whether the game runs its match, as once it has started it again; a world without its rules counts as running. */
export function matchStarted(): boolean {
  const rules = findEntities('citadel_gamerules')[0]
  return rules === undefined || Number(readField(rules, 'CCitadelGameRules', 'm_eGameState', 'uint32')) === GAME_IN_PROGRESS
}
