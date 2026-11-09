import { findEntities, readField } from 'modlock'

const POST_GAME = 8

export function matchOver(): boolean {
  const rules = findEntities('citadel_gamerules')[0]
  if (rules === undefined) {
    return false
  }
  return Number(readField(rules, 'CCitadelGameRules', 'm_eGameState', 'uint32')) >= POST_GAME
}
