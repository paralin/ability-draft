import {
  type Angles, createEntity, findEntities, findEntitiesByName, fireInput, log, readField, serverCommand, type Vector,
} from 'modlock'
import { set } from 'modlock/console'

import type { HeroRead } from '../match/roster'
import { corruptBotItems } from './bot-items'

/** One of the Broker's two places on dl_midtown, as the map's entity data has it. */
interface Booth {
  /** Begins the name of each of the booth's entities on the map. */
  readonly prefab: number
  readonly zone: Vector
  readonly glow: Vector
  readonly yaw: number
}

const BOOTHS: readonly Booth[] = [
  { prefab: 3568, zone: { x: 1056, y: -3108, z: 464 }, glow: { x: 1048, y: -2977, z: 512 }, yaw: 270 },
  { prefab: 3578, zone: { x: -1056, y: 3108, z: 464 }, glow: { x: -1048, y: 2977, z: 512 }, yaw: 90 },
]

/** Ends the name of each entity of a booth this touches. */
enum BoothPart {
  Pulse = 'pulse',
  ClosedDoor = 'door_closed',
  ClosedSign = 'closed_prop',
}

/** The game's team number for what serves both teams, as a booth's zone and glow do. */
const NO_TEAM = 0

const GLOW_EFFECT = 'particles/environmental/corrupted_dealer_glow.vpcf'

/** The spawn flags the map gives its shop zones. */
const ZONE_SPAWN_FLAGS = 4097

/** Lets the game open and restock the Broker; a match reads this as its world loads. */
export function switchOnBroker(): void {
  serverCommand('citadel_corrupted_item_shop_enabled 1')
}

/** When the Broker first opens, as the lobby chooses: never, or after so many minutes of the match. */
export enum BrokerOpening {
  Never = 0,
  Fifteen = 15,
  Thirty = 30,
}

/** In the order the lobby shows them. */
export const BROKER_OPENINGS: readonly BrokerOpening[] = [BrokerOpening.Never, BrokerOpening.Fifteen, BrokerOpening.Thirty]

/** Far past the end of any match, for a Broker who never opens. */
const NEVER_SECONDS = 360000

/**
 * Sets when the game first opens the Broker, its spawn_time_base; the game
 * still adds its own spawn_time_variance, a couple of minutes either way. Set
 * as the draft begins, before the match starts again.
 */
export function setBrokerOpening(opening: BrokerOpening): void {
  set('citadel_corrupted_item_shop_spawn_time_base', opening === BrokerOpening.Never ? NEVER_SECONDS : opening * 60)
  log(`broker: opens ${opening === BrokerOpening.Never ? 'never' : `after ${opening} minutes`}`)
}

function facingOf(booth: Booth): Angles {
  return { pitch: 0, yaw: booth.yaw, roll: 0 }
}

function createClosedZone(booth: Booth): number | undefined {
  return createEntity({
    designerName: 'citadel_trigger_corrupted_item_shop',
    subclass: '',
    team: NO_TEAM,
    position: booth.zone,
    facing: facingOf(booth),
    // The minimap draws him from this entity, which has no model the game would send it by.
    transmitAlways: true,
    keyValues: [
      { key: 'model', value: { text: `maps/dl_midtown/entities/${booth.prefab}_souls_dealer_shop_trigger_14781_${booth.prefab}_154.vmdl` } },
      { key: 'spawnflags', value: { integer: ZONE_SPAWN_FLAGS } },
      { key: 'StartDisabled', value: { boolean: true } },
    ],
  })
}

/** Opens the door through the map's own input and puts the glow in place. */
function openBooth(booth: Booth): void {
  const named = (part: BoothPart) => findEntitiesByName(`${booth.prefab}_souls_dealer_${part}`)
  // The input hangs the booth's goods each time, so only a closed door gets it.
  if (named(BoothPart.ClosedDoor).length > 0) {
    for (const pulse of named(BoothPart.Pulse)) {
      fireInput(pulse, 'InputOpen')
    }
  }
  for (const sign of named(BoothPart.ClosedSign)) {
    fireInput(sign, 'Kill')
  }
  createEntity({
    designerName: 'info_particle_system',
    subclass: '',
    team: NO_TEAM,
    position: booth.glow,
    facing: facingOf(booth),
    keyValues: [
      { key: 'effect_name', value: { text: GLOW_EFFECT } },
      { key: 'start_active', value: { boolean: true } },
    ],
  })
}

/**
 * Keeps zones at the booths, opens the booths once the game opens him, and from
 * then on has the bots corrupt their items.
 */
export class Broker {
  private zones: number[] = []
  private opened = false

  follow(heroes: readonly HeroRead[]): void {
    if (this.zones.length === 0) {
      this.zones = BOOTHS.flatMap((booth) => createClosedZone(booth) ?? [])
    }
    const rules = findEntities('citadel_gamerules')[0]
    if (rules === undefined) {
      return
    }
    if (!this.opened && readField(rules, 'CCitadelGameRules', 'm_nNumCorruptedItemShopSpawns', 'int32')) {
      this.opened = true
      for (const zone of this.zones) {
        fireInput(zone, 'Enable')
      }
      BOOTHS.forEach(openBooth)
      log('broker: open')
    }
    if (this.opened) {
      corruptBotItems(heroes, Number(readField(rules, 'CCitadelGameRules', 'm_nNumCorruptedItemsLimit', 'int32')))
    }
  }

  /** The previous world's zones and booths ended with it. */
  clear(): void {
    this.zones = []
    this.opened = false
  }
}
