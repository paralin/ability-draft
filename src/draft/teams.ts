/** The game's team numbers. */
export enum Team {
  HiddenKing = 2,
  Archmother = 3,
}

export const TEAM_SEATS = 6

/** Modlock reports a team as a plain number; this is where it becomes a Team. */
export function isTeam(team: number | undefined): team is Team {
  return team === Team.HiddenKing || team === Team.Archmother
}
