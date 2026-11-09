import { type EntityPlacement, findEntities } from 'modlock'

import { Team } from '../draft/teams'
import { controllerOf } from '../match/roster'

/** As the players chose them. */
export const SPOTS: Readonly<Record<Team, EntityPlacement>> = {
  [Team.HiddenKing]: { position: { x: -1237.8, y: -7205.8, z: 2270.4 }, facing: { pitch: 0, yaw: -90.5, roll: 0 } },
  [Team.Archmother]: { position: { x: 1288.4, y: 7411, z: 2125.5 }, facing: { pitch: 0, yaw: 89.5, roll: 0 } },
}

const HANDLE_INDEX_MASK = 0x7fff

/** A slot's controller is the entity at index slot + 1. */
export function observerOf(slot: number): number | undefined {
  return findEntities('observer').find((pawn) => {
    const controller = controllerOf(pawn)
    return controller !== undefined && (controller & HANDLE_INDEX_MASK) === slot + 1
  })
}
