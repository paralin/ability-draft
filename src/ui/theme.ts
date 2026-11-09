import { Team } from '../draft/teams'

export enum Color {
  Gold = '#ffd34d',
  GoldHover = '#ffe07a',
  OnGold = '#141414',
  Text = '#e8edf2',
  Muted = '#8b98a5',
  Green = '#7bd88f',
  Ultimate = '#b48cff',
  TimerRed = '#ff6b6b',
  TurnRed = '#ff4d4d',
  /** The cross over a drafted ability. */
  TakenCross = '#ff3b30',
  TurnRedFill = '#ff4d4d22',

  // A card that does not stand out keeps its frame's width in these.
  GoldClear = '#ffd34d00',
  TurnRedClear = '#ff4d4d00',

  // The backgrounds take the color of the game's tooltip window.
  LobbyWindow = '#181716ee',
  StatusBar = '#181716e8',
  QueueBar = '#18171699',
  /** Card fills a seat, a board hero or a small button. */
  Card = '#24221ff0',
  CardHover = '#2e2b27f0',
  CardOnTurn = '#2a1414f0',
  /** Well fills an empty picture or slot. */
  Well = '#0f0e0d',
  /** Edge frames a card or slot that stands out in no way. */
  Edge = '#45423d',

  LobbyShade = '#00000080',
  DraftShade = '#000000b0',

  OpenSeat = '#0f0e0d80',
  OpenSeatEdge = '#2a333d',
  OpenSeatText = '#5b6672',

  RemoveBotHover = '#3a1c1c',

  /**
   * The HUD's stylesheet paints every button grey and rings it in a wide white
   * border on hover, which shifts the board; a button's own background and border
   * win.
   */
  ClearFill = '#00000001',
  ClearEdge = '#ffffff00',
  Lit = '#ffffffaa',

  Amber = '#f0a03c',
  AmberTint = '#2a1c0c99',
  Sapphire = '#5b9dff',
  SapphireTint = '#0c1c2e99',
}

export enum Dim {
  TakenTurn = 0.3,
  TakenHero = 0.25,
  BlockedHero = 0.6,
  TakenAbility = 0.2,
  BlockedAbility = 0.55,
}

export function teamColor(team: Team): Color {
  return team === Team.HiddenKing ? Color.Amber : Color.Sapphire
}

export function teamTint(team: Team): Color {
  return team === Team.HiddenKing ? Color.AmberTint : Color.SapphireTint
}
