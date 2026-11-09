import { serverCommand } from 'modlock'
import { set } from 'modlock/console'

/** The game's ECitadelBotDifficulty; the game's default is Easy. */
enum BotDifficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3,
  Nightmare = 4,
}

/** Set to zero, they sharpen the bots past their difficulty. */
const BOT_SHARPNESS = ['citadel_bot_brain_aim_inaccuracy', 'citadel_bot_brain_enemy_reaction_time'] as const

/**
 * A bot takes its difficulty as it is created, and a console variable set in a
 * frame applies only after it, so this runs well before the bots join: as a
 * world starts and as a draft does.
 */
export function toughenBots(): void {
  set('citadel_default_bot_difficulty', BotDifficulty.Nightmare)
  for (const name of BOT_SHARPNESS) {
    // With no value the console prints the variable's value before.
    serverCommand(name)
    set(name, 0)
  }
}

/**
 * The game runs a bot's brain only in a bot match: without
 * citadel_solo_bot_match a bot addBot adds stands where it spawns, and with it
 * the bots walk their lanes and fight.
 */
export function wakeBots(): void {
  set('citadel_solo_bot_match', true)
}

/**
 * Runs as a world starts, so none starts in the bot match. A person in the bot
 * match has crashed the server (an access violation in server.dll, twice in
 * some ten matches); without it, though, the bots stand still once a person
 * plays.
 */
export function sleepBots(): void {
  set('citadel_solo_bot_match', false)
}
