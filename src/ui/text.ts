import { Team } from '../draft/teams'

export enum Word {
  Title = 'Ability Draft',
  Preview = 'Study the pool',
  Picking = 'Picking',
  YourTurn = 'Your turn!',
  HiddenKing = 'The Hidden King',
  Archmother = 'The Archmother',
  Bot = 'bot',
  Away = 'left',
  AddBot = '+ bot',
  ChooseTeam = 'Pick a team and press Ready',
  JoinTeam = 'Join this team',
  UnreadyButton = 'Not ready',
  Waiting = 'Waiting',
  AllReady = 'Everyone is ready; the draft starts in',
  OpenSeat = 'Open',
  NoSeat = 'Both teams are full; you get the first seat that opens',
  BotTag = 'BOT',
  You = 'you',
  Ready = 'Ready',
  Preparing = 'Heroes are taking the field…',
  HeroLocked = 'The draft gives your hero; it cannot change.',
  HeroInDraft = 'Heroes are picked in the draft.',
  LateJoin = 'The draft is over; you got random abilities.',
  MatchStarted = 'The match has started; you watch it and can join the next one.',
  Broker = 'Broker',
  BrokerNever = 'Never',
  Minutes = 'min',
}

export function teamName(team: Team): Word {
  return team === Team.HiddenKing ? Word.HiddenKing : Word.Archmother
}
