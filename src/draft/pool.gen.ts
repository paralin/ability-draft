import type { PoolHero } from './pool'

/** Sorted by title, each with its four abilities. */
export const poolHeroes: readonly PoolHero[] = [
  {
    "name": "hero_atlas",
    "id": 6,
    "title": "Abrams",
    "portrait": "file://{images}/heroes/bull_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_bull_heal",
        "icon": "file://{images}/hud/abilities/bull_drain.psd"
      },
      {
        "name": "citadel_ability_bull_charge",
        "icon": "file://{images}/hud/abilities/bull_charge.psd"
      },
      {
        "name": "citadel_ability_passive_beefy",
        "icon": "file://{images}/hud/abilities/bull_beef.psd"
      },
      {
        "name": "citadel_ability_bull_leap",
        "icon": "file://{images}/hud/abilities/bull_jump.psd"
      }
    ]
  },
  {
    "name": "hero_fencer",
    "id": 77,
    "title": "Apollo",
    "portrait": "file://{images}/heroes/fencer_sm.psd",
    "abilities": [
      {
        "name": "ability_fencer_throwblade",
        "icon": "file://{images}/hud/abilities/fencer/fencer_sigil.psd"
      },
      {
        "name": "ability_fencer_riposte",
        "icon": "file://{images}/hud/abilities/fencer/fencer_riposte.psd"
      },
      {
        "name": "ability_fencer_lunge",
        "icon": "file://{images}/hud/abilities/fencer/fencer_lungingstab.psd"
      },
      {
        "name": "ability_fencer_ultimate",
        "icon": "file://{images}/hud/abilities/fencer/fencer_ult.psd"
      }
    ]
  },
  {
    "name": "hero_baba",
    "id": 88,
    "title": "Baba",
    "portrait": "file://{images}/heroes/baba_sm.psd",
    "abilities": [
      {
        "name": "ability_baba_bubbling_brew",
        "icon": "file://{images}/hud/abilities/baba/threadsap.psd"
      },
      {
        "name": "ability_baba_bench_run",
        "icon": "file://{images}/hud/abilities/baba/strafing_run.psd"
      },
      {
        "name": "ability_baba_hexing_brew",
        "icon": "file://{images}/hud/abilities/baba/teapot_brew.psd"
      },
      {
        "name": "ability_baba_ultimate_2",
        "icon": "file://{images}/hud/abilities/baba/pigeon_launcher.psd"
      }
    ]
  },
  {
    "name": "hero_bebop",
    "id": 15,
    "title": "Bebop",
    "portrait": "file://{images}/heroes/bebop_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_uppercut",
        "icon": "file://{images}/hud/abilities/bebop/bebop_uppercut.psd"
      },
      {
        "name": "citadel_ability_sticky_bomb",
        "icon": "file://{images}/hud/abilities/bebop/bebop_sticky_bomb.psd"
      },
      {
        "name": "citadel_ability_hook",
        "icon": "file://{images}/hud/abilities/bebop/bebop_hook.psd"
      },
      {
        "name": "citadel_ability_bebop_laser_beam",
        "icon": "file://{images}/hud/abilities/bebop/bebop_hyper_beam.psd"
      }
    ]
  },
  {
    "name": "hero_punkgoat",
    "id": 72,
    "title": "Billy",
    "portrait": "file://{images}/heroes/punkgoat_sm.psd",
    "abilities": [
      {
        "name": "ability_punkgoat_ult",
        "icon": "file://{images}/hud/abilities/punkgoat/goat_sigilslam.psd"
      },
      {
        "name": "ability_punkgoat_goatflip",
        "icon": "file://{images}/hud/abilities/punkgoat/goat_risingram.psd"
      },
      {
        "name": "ability_punkgoat_blasted",
        "icon": "file://{images}/hud/abilities/punkgoat/goat_blasted.psd"
      },
      {
        "name": "ability_punkgoat_tether",
        "icon": "file://{images}/hud/abilities/punkgoat/goat_chaingang.psd"
      }
    ]
  },
  {
    "name": "hero_nano",
    "id": 16,
    "title": "Calico",
    "portrait": "file://{images}/heroes/nano_sm.psd",
    "abilities": [
      {
        "name": "ability_nano_clustergrenade",
        "icon": "file://{images}/hud/abilities/nano/nano_clustergrenade.psd"
      },
      {
        "name": "ability_nano_dash",
        "icon": "file://{images}/hud/abilities/nano/nano_dash.psd"
      },
      {
        "name": "ability_nano_catform",
        "icon": "file://{images}/hud/abilities/nano/nano_catform.psd"
      },
      {
        "name": "ability_nano_shadow_pulse",
        "icon": "file://{images}/hud/abilities/nano/nano_shadow_pulse.psd"
      }
    ]
  },
  {
    "name": "hero_unicorn",
    "id": 81,
    "title": "Celeste",
    "portrait": "file://{images}/heroes/unicorn_sm.psd",
    "abilities": [
      {
        "name": "ability_unicorn_radiantblast",
        "icon": "file://{images}/hud/abilities/unicorn/unicorn_flare.psd"
      },
      {
        "name": "ability_unicorn_prismaticguard",
        "icon": "file://{images}/hud/abilities/unicorn/unicorn_shield.psd"
      },
      {
        "name": "ability_unicorn_luminousstrike",
        "icon": "file://{images}/hud/abilities/unicorn/unicorn_luminousflux.psd"
      },
      {
        "name": "ability_unicorn_dazzlingorb",
        "icon": "file://{images}/hud/abilities/unicorn/unicorn_orb.psd"
      }
    ]
  },
  {
    "name": "hero_deadpack",
    "id": 78,
    "title": "Deadman Danny",
    "portrait": "file://{images}/heroes/deadpack_sm.psd",
    "abilities": [
      {
        "name": "ability_deadpack_chargeblast",
        "icon": "file://{images}/hud/abilities/deadpack/deadpack_salvo.psd"
      },
      {
        "name": "ability_deadpack_rocketeer",
        "icon": "file://{images}/hud/abilities/deadpack/deadpack_chimera.psd"
      },
      {
        "name": "ability_deadpack_flamethrower",
        "icon": "file://{images}/hud/abilities/deadpack/deadpack_thermalmass.psd"
      },
      {
        "name": "ability_deadpack_ultimate",
        "icon": "file://{images}/hud/abilities/deadpack/deadpack_flight.psd"
      }
    ]
  },
  {
    "name": "hero_drifter",
    "id": 64,
    "title": "Drifter",
    "portrait": "file://{images}/heroes/drifter_sm.psd",
    "abilities": [
      {
        "name": "drifter_blood_blast",
        "icon": "file://{images}/hud/abilities/drifter/drifter_claw.psd"
      },
      {
        "name": "drifter_shadow_mark",
        "icon": "file://{images}/hud/abilities/drifter/drifter_stalkersmark.psd"
      },
      {
        "name": "ability_drifter_hunger",
        "icon": "file://{images}/hud/abilities/drifter/drifter_thehunger.psd"
      },
      {
        "name": "drifter_darkness",
        "icon": "file://{images}/hud/abilities/drifter/darkness.psd"
      }
    ]
  },
  {
    "name": "hero_dynamo",
    "id": 11,
    "title": "Dynamo",
    "portrait": "file://{images}/heroes/sumo_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_stomp",
        "icon": "file://{images}/hud/abilities/sumo/sumo_stomp.psd"
      },
      {
        "name": "citadel_ability_void_sphere",
        "icon": "file://{images}/hud/abilities/sumo/sumo_quantum.psd"
      },
      {
        "name": "citadel_ability_nikuman",
        "icon": "file://{images}/hud/abilities/sumo/sumo_pork_bun.psd"
      },
      {
        "name": "citadel_ability_self_vacuum",
        "icon": "file://{images}/hud/abilities/sumo/sumo_vacuum.psd"
      }
    ]
  },
  {
    "name": "hero_necro",
    "id": 76,
    "title": "Graves",
    "portrait": "file://{images}/heroes/necro_sm.psd",
    "abilities": [
      {
        "name": "ability_necro_hauntingskull",
        "icon": "file://{images}/hud/abilities/necro/necro_skull.psd"
      },
      {
        "name": "ability_necro_zombiewall",
        "icon": "file://{images}/hud/abilities/necro/necro_hands.psd"
      },
      {
        "name": "ability_necro_fear",
        "icon": "file://{images}/hud/abilities/necro/necro_siphon.psd"
      },
      {
        "name": "ability_necro_gravestone",
        "icon": "file://{images}/hud/abilities/necro/necro_gravestone.psd"
      }
    ]
  },
  {
    "name": "hero_orion",
    "id": 17,
    "title": "Grey Talon",
    "portrait": "file://{images}/heroes/archer_sm.psd",
    "abilities": [
      {
        "name": "ability_charged_shot",
        "icon": "file://{images}/hud/abilities/archer/archer_charged_shot.psd"
      },
      {
        "name": "ability_power_jump",
        "icon": "file://{images}/hud/abilities/archer/archer_power_jump.psd"
      },
      {
        "name": "ability_immobilize_trap",
        "icon": "file://{images}/hud/abilities/archer/imobolize_trap.psd"
      },
      {
        "name": "ability_guided_arrow",
        "icon": "file://{images}/hud/abilities/archer/archer_guided_arrow.psd"
      }
    ]
  },
  {
    "name": "hero_haze",
    "id": 13,
    "title": "Haze",
    "portrait": "file://{images}/heroes/haze_sm.psd",
    "abilities": [
      {
        "name": "ability_sleep_dagger",
        "icon": "file://{images}/hud/abilities/haze/haze_sleep_dagger.psd"
      },
      {
        "name": "ability_smoke_bomb",
        "icon": "file://{images}/hud/abilities/haze/haze_smoke_bomb.psd"
      },
      {
        "name": "ability_stacking_damage",
        "icon": "file://{images}/hud/abilities/haze/haze_fixation.psd"
      },
      {
        "name": "ability_bullet_flurry",
        "icon": "file://{images}/hud/abilities/haze/haze_bullet_flurry.psd"
      }
    ]
  },
  {
    "name": "hero_astro",
    "id": 14,
    "title": "Holliday",
    "portrait": "file://{images}/heroes/astro_sm.psd",
    "abilities": [
      {
        "name": "ability_explosive_barrel",
        "icon": "file://{images}/hud/abilities/astro/holliday_powder_keg.psd"
      },
      {
        "name": "ability_bounce_pad",
        "icon": "file://{images}/hud/abilities/astro/holliday_bounce_pad.psd"
      },
      {
        "name": "ability_crackshot",
        "icon": "file://{images}/hud/abilities/astro/holliday_crackshot.psd"
      },
      {
        "name": "ability_gravity_lasso",
        "icon": "file://{images}/hud/abilities/astro/holliday_spirit_lasso.psd"
      }
    ]
  },
  {
    "name": "hero_inferno",
    "id": 1,
    "title": "Infernus",
    "portrait": "file://{images}/heroes/inferno_sm.psd",
    "abilities": [
      {
        "name": "ability_incendiary_projectile",
        "icon": "file://{images}/hud/abilities/inferno_molotov.psd"
      },
      {
        "name": "ability_flame_dash",
        "icon": "file://{images}/hud/abilities/inferno_dash.psd"
      },
      {
        "name": "ability_afterburn",
        "icon": "file://{images}/hud/abilities/inferno_deflect.psd"
      },
      {
        "name": "ability_fire_bomb",
        "icon": "file://{images}/hud/abilities/inferno_bomb.psd"
      }
    ]
  },
  {
    "name": "hero_tengu",
    "id": 20,
    "title": "Ivy",
    "portrait": "file://{images}/heroes/tengu_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_tengu_urn",
        "icon": "file://{images}/hud/abilities/tengu/tengu_storm_flask.psd"
      },
      {
        "name": "citadel_ability_tangotether",
        "icon": "file://{images}/hud/abilities/tengu/tengu_tether.psd"
      },
      {
        "name": "citadel_ability_tengu_stone_form",
        "icon": "file://{images}/hud/abilities/tengu/tengu_stone_form.psd"
      },
      {
        "name": "citadel_ability_tengu_airlift",
        "icon": "file://{images}/hud/abilities/tengu/tengu_lightning_crash.psd"
      }
    ]
  },
  {
    "name": "hero_kelvin",
    "id": 12,
    "title": "Kelvin",
    "portrait": "file://{images}/heroes/kelvin_sm.psd",
    "abilities": [
      {
        "name": "ability_ice_grenade",
        "icon": "file://{images}/hud/abilities/kelvin/freezing_grenade.psd"
      },
      {
        "name": "ability_icepath",
        "icon": "file://{images}/hud/abilities/kelvin/ice_path.psd"
      },
      {
        "name": "ability_icebeam",
        "icon": "file://{images}/hud/abilities/kelvin/ice_beam.psd"
      },
      {
        "name": "ability_ice_dome",
        "icon": "file://{images}/hud/abilities/kelvin/frozen_shelter.psd"
      }
    ]
  },
  {
    "name": "hero_ghost",
    "id": 4,
    "title": "Lady Geist",
    "portrait": "file://{images}/heroes/spectre_sm.psd",
    "abilities": [
      {
        "name": "ability_blood_bomb",
        "icon": "file://{images}/hud/abilities/spectre/blood_bomb.psd"
      },
      {
        "name": "ability_life_drain",
        "icon": "file://{images}/hud/abilities/spectre/life_drain.psd"
      },
      {
        "name": "ability_blood_shards",
        "icon": "file://{images}/hud/abilities/spectre/geist_dagger.psd"
      },
      {
        "name": "ability_health_swap",
        "icon": "file://{images}/hud/abilities/spectre/blood_exchange.psd"
      }
    ]
  },
  {
    "name": "hero_lash",
    "id": 31,
    "title": "Lash",
    "portrait": "file://{images}/heroes/lash_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_lash_down_strike",
        "icon": "file://{images}/hud/abilities/lash/lash_death_slam.psd"
      },
      {
        "name": "citadel_ability_lash",
        "icon": "file://{images}/hud/abilities/lash/lash_lash.psd"
      },
      {
        "name": "ability_lash_flog",
        "icon": "file://{images}/hud/abilities/lash/lash_flog.psd"
      },
      {
        "name": "citadel_ability_lash_ultimate",
        "icon": "file://{images}/hud/abilities/lash/lash_counter_lash.psd"
      }
    ]
  },
  {
    "name": "hero_forge",
    "id": 8,
    "title": "McGinnis",
    "portrait": "file://{images}/heroes/engineer_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_shieldedsentry",
        "icon": "file://{images}/hud/abilities/engineer_turret.psd"
      },
      {
        "name": "citadel_ability_mobile_resupply",
        "icon": "file://{images}/hud/abilities/engineer_resupply.psd"
      },
      {
        "name": "citadel_ability_fissure_wall",
        "icon": "file://{images}/hud/abilities/engineer_fissure_2.psd"
      },
      {
        "name": "citadel_ability_rocket_barrage",
        "icon": "file://{images}/hud/abilities/engineer_rockets.psd"
      }
    ]
  },
  {
    "name": "hero_vampirebat",
    "id": 63,
    "title": "Mina",
    "portrait": "file://{images}/heroes/vampirebat_sm.psd",
    "abilities": [
      {
        "name": "ability_vampirebat_steallife",
        "icon": "file://{images}/hud/abilities/vampirebat/vampirebat_rake.psd"
      },
      {
        "name": "ability_vampirebat_batblink",
        "icon": "file://{images}/hud/abilities/vampirebat/vampirebat_sanguine_retreat.psd"
      },
      {
        "name": "ability_vampirebat_lovebites",
        "icon": "file://{images}/hud/abilities/vampirebat/vampirebat_love_bites.psd"
      },
      {
        "name": "ability_vampirebat_batswarm",
        "icon": "file://{images}/hud/abilities/vampirebat/vampirebat_nox_nostra.psd"
      }
    ]
  },
  {
    "name": "hero_mirage",
    "id": 52,
    "title": "Mirage",
    "portrait": "file://{images}/heroes/mirage_sm.psd",
    "abilities": [
      {
        "name": "mirage_fire_beetles",
        "icon": "file://{images}/hud/abilities/mirage/mirage_fire_beetles.psd"
      },
      {
        "name": "mirage_tornado",
        "icon": "file://{images}/hud/abilities/mirage/mirage_tornado.psd"
      },
      {
        "name": "mirage_sand_phantom",
        "icon": "file://{images}/hud/abilities/mirage/mirage_sand_phantom.psd"
      },
      {
        "name": "mirage_teleport",
        "icon": "file://{images}/hud/abilities/mirage/mirage_teleport.psd"
      }
    ]
  },
  {
    "name": "hero_krill",
    "id": 18,
    "title": "Mo & Krill",
    "portrait": "file://{images}/heroes/digger_sm.psd",
    "abilities": [
      {
        "name": "ability_intimidate",
        "icon": "file://{images}/hud/abilities/grappler/grappler_regen.psd"
      },
      {
        "name": "ability_burrow",
        "icon": "file://{images}/hud/abilities/grappler/grappler_spin.psd"
      },
      {
        "name": "ability_throw_sand",
        "icon": "file://{images}/hud/abilities/grappler/grappler_throw_sand.psd"
      },
      {
        "name": "ability_ult_combo",
        "icon": "file://{images}/hud/abilities/grappler/grappler_combo.psd"
      }
    ]
  },
  {
    "name": "hero_nurse",
    "id": 87,
    "title": "Nurse Harrow",
    "portrait": "file://{images}/heroes/nurse_sm.psd",
    "abilities": [
      {
        "name": "ability_nurse_leech_therapy",
        "icon": "file://{images}/hud/abilities/nurse/leech.psd"
      },
      {
        "name": "ability_nurse_adrenaline_rush",
        "icon": "file://{images}/hud/abilities/nurse/nurse_vapors.psd"
      },
      {
        "name": "ability_nurse_healing_needles",
        "icon": "file://{images}/hud/abilities/nurse/needle.psd"
      },
      {
        "name": "ability_nurse_fear",
        "icon": "file://{images}/hud/abilities/nurse/medicine_bag.psd"
      }
    ]
  },
  {
    "name": "hero_bookworm",
    "id": 67,
    "title": "Paige",
    "portrait": "file://{images}/heroes/bookworm_sm.psd",
    "abilities": [
      {
        "name": "ability_bookworm_dragonfire",
        "icon": "file://{images}/hud/abilities/bookworm/bookworm_dragon.psd"
      },
      {
        "name": "ability_bookworm_knightbarrier",
        "icon": "file://{images}/hud/abilities/bookworm/bookworm_defendandfight.psd"
      },
      {
        "name": "ability_bookworm_aoemagic",
        "icon": "file://{images}/hud/abilities/bookworm/bookworm_blindinglight.psd"
      },
      {
        "name": "ability_bookworm_knightcharge",
        "icon": "file://{images}/hud/abilities/bookworm/bookworm_charge.psd"
      }
    ]
  },
  {
    "name": "hero_chrono",
    "id": 10,
    "title": "Paradox",
    "portrait": "file://{images}/heroes/chrono_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_chrono_pulse_grenade",
        "icon": "file://{images}/hud/abilities/chrono/chrono_time_bomb.psd"
      },
      {
        "name": "citadel_ability_chrono_time_wall",
        "icon": "file://{images}/hud/abilities/chrono/chrono_time_wall.psd"
      },
      {
        "name": "citadel_ability_chrono_kinetic_carbine",
        "icon": "file://{images}/hud/abilities/duo/duo_attack.psd"
      },
      {
        "name": "citadel_ability_chrono_swap",
        "icon": "file://{images}/hud/abilities/chrono/chrono_swap.psd"
      }
    ]
  },
  {
    "name": "hero_synth",
    "id": 50,
    "title": "Pocket",
    "portrait": "file://{images}/heroes/synth_sm.psd",
    "abilities": [
      {
        "name": "synth_barrage",
        "icon": "file://{images}/hud/abilities/synth/synth_barrage.psd"
      },
      {
        "name": "synth_plasma_flux",
        "icon": "file://{images}/hud/abilities/synth/synth_plasma_flux.psd"
      },
      {
        "name": "synth_pulse",
        "icon": "file://{images}/hud/abilities/synth/synth_pulse.psd"
      },
      {
        "name": "synth_affliction",
        "icon": "file://{images}/hud/abilities/synth/synth_affliction.psd"
      }
    ]
  },
  {
    "name": "hero_ratking",
    "id": 84,
    "title": "Rat King",
    "portrait": "file://{images}/heroes/ratking_sm.psd",
    "abilities": [
      {
        "name": "ability_ratking_scrap_grenade",
        "icon": "file://{images}/hud/abilities/ratking/ratking_grenade.psd"
      },
      {
        "name": "ability_ratking_ratnibble",
        "icon": "file://{images}/hud/abilities/ratking/ratking_swarm.psd"
      },
      {
        "name": "ability_ratking_ratarmor",
        "icon": "file://{images}/hud/abilities/ratking/ratking_shield.psd"
      },
      {
        "name": "ability_ratking_standard_bearer",
        "icon": "file://{images}/hud/abilities/ratking/ratking_flag.psd"
      }
    ]
  },
  {
    "name": "hero_familiar",
    "id": 79,
    "title": "Rem",
    "portrait": "file://{images}/heroes/familiar_sm.psd",
    "abilities": [
      {
        "name": "ability_familiar_ability02",
        "icon": "file://{images}/hud/abilities/familiar/familiar_pillow.psd"
      },
      {
        "name": "ability_familiar_attach",
        "icon": "file://{images}/hud/abilities/familiar/familiar_tag_along.psd"
      },
      {
        "name": "ability_familiar_helpinghands",
        "icon": "file://{images}/hud/abilities/familiar/familiar_helpers.psd"
      },
      {
        "name": "ability_familiar_ability01",
        "icon": "file://{images}/hud/abilities/familiar/familiar_sleep.psd"
      }
    ]
  },
  {
    "name": "hero_gigawatt",
    "id": 2,
    "title": "Seven",
    "portrait": "file://{images}/heroes/gigawatt_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_lightning_ball",
        "icon": "file://{images}/hud/abilities/giga_ball.psd"
      },
      {
        "name": "citadel_ability_static_charge",
        "icon": "file://{images}/hud/abilities/giga_static.psd"
      },
      {
        "name": "ability_power_surge",
        "icon": "file://{images}/hud/abilities/giga_chain.psd"
      },
      {
        "name": "citadel_ability_storm_cloud",
        "icon": "file://{images}/hud/abilities/giga_storm.psd"
      }
    ]
  },
  {
    "name": "hero_shiv",
    "id": 19,
    "title": "Shiv",
    "portrait": "file://{images}/heroes/shiv_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_shiv_dagger",
        "icon": "file://{images}/hud/abilities/shiv/shiv_toss.psd"
      },
      {
        "name": "citadel_ability_shiv_dash",
        "icon": "file://{images}/hud/abilities/shiv/shiv_flash.psd"
      },
      {
        "name": "citadel_ability_shiv_defer_damage",
        "icon": "file://{images}/hud/abilities/shiv/shiv_bloodletting.psd"
      },
      {
        "name": "citadel_ability_shiv_killing_blow",
        "icon": "file://{images}/hud/abilities/shiv/shiv_killing_blow.psd"
      }
    ]
  },
  {
    "name": "hero_werewolf",
    "id": 80,
    "title": "Silver",
    "portrait": "file://{images}/heroes/werewolf_sm.psd",
    "abilities": [
      {
        "name": "ability_werewolf_unloadgun",
        "icon": "file://{images}/hud/abilities/werewolf/werewolf_slamfire.psd"
      },
      {
        "name": "ability_werewolf_kickflip",
        "icon": "file://{images}/hud/abilities/werewolf/werewolf_jumpback.psd"
      },
      {
        "name": "ability_werewolf_netshot",
        "icon": "file://{images}/hud/abilities/werewolf/werewolf_bola.psd"
      },
      {
        "name": "ability_werewolf_transformation",
        "icon": "file://{images}/hud/abilities/werewolf/werewolf_lycancurse.psd"
      }
    ]
  },
  {
    "name": "hero_magician",
    "id": 60,
    "title": "Sinclair",
    "portrait": "file://{images}/heroes/magician_sm.psd",
    "abilities": [
      {
        "name": "ability_magician_magicbolt",
        "icon": "file://{images}/hud/abilities/magician/magician_magicbolt.psd"
      },
      {
        "name": "ability_magician_cloneturret",
        "icon": "file://{images}/hud/abilities/magician/magician_cloneturret.psd"
      },
      {
        "name": "ability_magician_animalhexarea",
        "icon": "file://{images}/hud/abilities/magician/magician_animalcurse.psd"
      },
      {
        "name": "ability_magician_copyult",
        "icon": "file://{images}/hud/abilities/magician/magician_copyult.psd"
      }
    ]
  },
  {
    "name": "hero_chessmaster",
    "id": 85,
    "title": "Solomon",
    "portrait": "file://{images}/heroes/chessmaster_sm.psd",
    "abilities": [
      {
        "name": "ability_chessmaster_throwbishop",
        "icon": "file://{images}/hud/abilities/chess/chessmaster_bishop.psd"
      },
      {
        "name": "ability_chessmaster_knightbuff",
        "icon": "file://{images}/hud/abilities/chess/chessmaster_knight.psd"
      },
      {
        "name": "ability_chessmaster_forkpiece",
        "icon": "file://{images}/hud/abilities/chess/chessmaster_rook.psd"
      },
      {
        "name": "ability_chessmaster_queen",
        "icon": "file://{images}/hud/abilities/chess/chessmaster_queen.psd"
      }
    ]
  },
  {
    "name": "hero_doorman",
    "id": 69,
    "title": "The Doorman",
    "portrait": "file://{images}/heroes/doorman_sm.psd",
    "abilities": [
      {
        "name": "ability_doorman_bomb",
        "icon": "file://{images}/hud/abilities/doorman/doorman_bell.psd"
      },
      {
        "name": "ability_doorman_doorway",
        "icon": "file://{images}/hud/abilities/doorman/doorman_doorway.psd"
      },
      {
        "name": "ability_doorman_luggage_cart",
        "icon": "file://{images}/hud/abilities/doorman/doorman_luggagetrolley.psd"
      },
      {
        "name": "ability_doorman_hotel",
        "icon": "file://{images}/hud/abilities/doorman/doorman_elevator.psd"
      }
    ]
  },
  {
    "name": "hero_priest",
    "id": 65,
    "title": "Venator",
    "portrait": "file://{images}/heroes/priest_sm.psd",
    "abilities": [
      {
        "name": "ability_priest_flashbang",
        "icon": "file://{images}/hud/abilities/priest/priest_grenade.psd"
      },
      {
        "name": "ability_priest_knockback",
        "icon": "file://{images}/hud/abilities/priest/priest_shotgun.psd"
      },
      {
        "name": "ability_priest_beartrap",
        "icon": "file://{images}/hud/abilities/priest/priest_trap.psd"
      },
      {
        "name": "ability_priest_weaponswap",
        "icon": "file://{images}/hud/abilities/priest/priest_crossbow.psd"
      }
    ]
  },
  {
    "name": "hero_frank",
    "id": 66,
    "title": "Victor",
    "portrait": "file://{images}/heroes/frank_sm.psd",
    "abilities": [
      {
        "name": "ability_frank_shocktarget2",
        "icon": "file://{images}/hud/abilities/frank/frank_pain_battery.psd"
      },
      {
        "name": "ability_frank_selfzap",
        "icon": "file://{images}/hud/abilities/frank/frank_jump_start.psd"
      },
      {
        "name": "ability_frank_painaura",
        "icon": "file://{images}/hud/abilities/frank/frank_aura_of_suffering.psd"
      },
      {
        "name": "ability_frank_revive",
        "icon": "file://{images}/hud/abilities/frank/frank_shocking_reanimation.psd"
      }
    ]
  },
  {
    "name": "hero_hornet",
    "id": 3,
    "title": "Vindicta",
    "portrait": "file://{images}/heroes/hornet_sm.png",
    "abilities": [
      {
        "name": "citadel_ability_hornet_chain",
        "icon": "file://{images}/hud/abilities/hornet/vindicta_stake.psd"
      },
      {
        "name": "citadel_ability_hornet_leap",
        "icon": "file://{images}/hud/abilities/hornet/vindicta_flight.psd"
      },
      {
        "name": "citadel_ability_hornet_sting",
        "icon": "file://{images}/hud/abilities/hornet/hornet_crow.psd"
      },
      {
        "name": "citadel_ability_hornet_snipe",
        "icon": "file://{images}/hud/abilities/hornet/hornet_assassinate.psd"
      }
    ]
  },
  {
    "name": "hero_artist",
    "id": 86,
    "title": "Violet",
    "portrait": "file://{images}/heroes/artist_sm.psd",
    "abilities": [
      {
        "name": "ability_artist_homingbrush",
        "icon": "file://{images}/hud/abilities/artist/artist_livingink.psd"
      },
      {
        "name": "ability_artist_rollingprojectile",
        "icon": "file://{images}/hud/abilities/artist/artist_brush.psd"
      },
      {
        "name": "ability_artist_tether",
        "icon": "file://{images}/hud/abilities/artist/artist_portrait.psd"
      },
      {
        "name": "ability_artist_bamboogrove",
        "icon": "file://{images}/hud/abilities/artist/artist_landscape.psd"
      }
    ]
  },
  {
    "name": "hero_viscous",
    "id": 35,
    "title": "Viscous",
    "portrait": "file://{images}/heroes/viscous_sm.psd",
    "abilities": [
      {
        "name": "viscous_goo_grenade",
        "icon": "file://{images}/hud/abilities/viscous/viscous_goo_ball.psd"
      },
      {
        "name": "viscous_restorative_goo",
        "icon": "file://{images}/hud/abilities/viscous/viscous_restorative_goo.psd"
      },
      {
        "name": "viscous_telepunch",
        "icon": "file://{images}/hud/abilities/viscous/viscous_goo_punch.psd"
      },
      {
        "name": "viscous_goo_bowling_ball",
        "icon": "file://{images}/hud/abilities/viscous/viscous_goo_sphere.psd"
      }
    ]
  },
  {
    "name": "hero_viper",
    "id": 58,
    "title": "Vyper",
    "portrait": "file://{images}/heroes/kali_sm.psd",
    "abilities": [
      {
        "name": "ability_viper_debuffdagger",
        "icon": "file://{images}/hud/abilities/viper/viper_debuffdagger.psd"
      },
      {
        "name": "ability_viper_venom",
        "icon": "file://{images}/hud/abilities/viper/viper_venom.psd"
      },
      {
        "name": "ability_viper_snakedash",
        "icon": "file://{images}/hud/abilities/viper/viper_snakedash.psd"
      },
      {
        "name": "ability_viper_petrifybola",
        "icon": "file://{images}/hud/abilities/viper/viper_petrifybola.psd"
      }
    ]
  },
  {
    "name": "hero_warden",
    "id": 25,
    "title": "Warden",
    "portrait": "file://{images}/heroes/warden_sm.psd",
    "abilities": [
      {
        "name": "ability_warden_crowd_control",
        "icon": "file://{images}/hud/abilities/warden/warden_crowd_control.psd"
      },
      {
        "name": "ability_warden_high_alert",
        "icon": "file://{images}/hud/abilities/warden/warden_high_alert.psd"
      },
      {
        "name": "ability_warden_lock_down",
        "icon": "file://{images}/hud/abilities/warden/warden_lock_down.psd"
      },
      {
        "name": "ability_warden_riot_protocol",
        "icon": "file://{images}/hud/abilities/warden/warden_riot_protocol.psd"
      }
    ]
  },
  {
    "name": "hero_wraith",
    "id": 7,
    "title": "Wraith",
    "portrait": "file://{images}/heroes/wraith_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_card_toss",
        "icon": "file://{images}/hud/abilities/wraith_card_trick.psd"
      },
      {
        "name": "citadel_ability_projectmind",
        "icon": "file://{images}/hud/abilities/wraith_teleport.psd"
      },
      {
        "name": "citadel_ability_wraith_rapidfire",
        "icon": "file://{images}/hud/abilities/wraith_aura.psd"
      },
      {
        "name": "citadel_ability_psychic_lift",
        "icon": "file://{images}/hud/abilities/wraith_lift.psd"
      }
    ]
  },
  {
    "name": "hero_yamato",
    "id": 27,
    "title": "Yamato",
    "portrait": "file://{images}/heroes/yamato_sm.psd",
    "abilities": [
      {
        "name": "citadel_ability_power_slash",
        "icon": "file://{images}/hud/abilities/yamato/yamato_power_slash.psd"
      },
      {
        "name": "citadel_ability_flying_strike",
        "icon": "file://{images}/hud/abilities/yamato/yamato_flying_strike.psd"
      },
      {
        "name": "citadel_ability_healing_slash",
        "icon": "file://{images}/hud/abilities/yamato/yamato_crimson_slash.psd"
      },
      {
        "name": "citadel_ability_infinity_slash",
        "icon": "file://{images}/hud/abilities/yamato/yamato_blinding_steel.psd"
      }
    ]
  }
]
