/**
 * The game's numbers, as Ability.slot reports them. The board's columns and a
 * seat's picks use the same numbers for the ability keys.
 */
export enum AbilitySlot {
  First = 0,
  Second = 1,
  Third = 2,
  Ultimate = 3,
  /** Holds a weapon's alternate fire. */
  Alternate = 20,
}

export const ABILITY_SLOTS = [
  AbilitySlot.First,
  AbilitySlot.Second,
  AbilitySlot.Third,
  AbilitySlot.Ultimate,
] as const

/** Every key but the ultimate's. */
export const REGULAR_ABILITIES = ABILITY_SLOTS.length - 1
