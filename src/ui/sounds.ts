export enum Sound {
  Start = 'UI.ItemDraft.Start',
  End = 'UI.ItemDraft.End',
  Scroll = 'UI.ItemDraft.RevolverSpin',
  YourTurn = 'UI.Matchmake.Made',
  Tick = 'Gameplay.Pause.Resume.Countdown.Tick',
  OwnAbility = 'UI.Shop.Ability.Upgrade',
  OwnHero = 'UI.Roster.Confirm',
  Refuse = 'UI.Settings.Error',
  Ready = 'UI.PlayMenu.Activate',
  Press = 'UI.MainMenu.Activate',
}

/**
 * Keeps the scroll's first run of clicks: the item draft's spin clicks for about
 * 0.65 seconds, rests, then clicks on for two more.
 */
export const SCROLL_SECONDS = 0.6

export const COUNTDOWN_SECONDS = 3
