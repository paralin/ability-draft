import { type GameSound, uiSound } from '../sound/sound'

/** The game's sound events the mod's buttons play as they are pressed. */
export enum Sound {
  Ready = 'UI.PlayMenu.Activate',
  Press = 'UI.MainMenu.Activate',
}

/**
 * What the server plays in a player's game as the draft goes: the files of the
 * game's own sound events, named beside each.
 */
export const Cue = {
  // UI.ItemDraft.Start and UI.ItemDraft.End.
  Start: uiSound('ui_menu_open_swoop', 7),
  End: uiSound('ui_menu_open_swoop', 7),
  // UI.Settings.Keybind.Press, a key's click: the item draft's spin runs five
  // seconds, and a file once started cannot be cut short.
  Scroll: uiSound('ui_keybind_press', 6),
  // UI.Matchmake.Made.
  YourTurn: uiSound('ui_game_matchmake_made'),
  // Gameplay.Pause.Resume.Countdown.Tick.
  Tick: uiSound('ui_pause_count'),
  // UI.Shop.Ability.Upgrade.
  OwnAbility: uiSound('ui_hud_upgrade_ability', 4),
  // UI.Roster.Confirm.
  OwnHero: uiSound('ui_confirm_roster'),
  // UI.Settings.Error.
  Refuse: uiSound('ui_meepmop', 6),
} satisfies Record<string, GameSound>

export const COUNTDOWN_SECONDS = 3
