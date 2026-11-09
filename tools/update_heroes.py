import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import winreg
from dataclasses import asdict, dataclass
from enum import StrEnum
from pathlib import Path

POOL_PATH = Path(__file__).resolve().parent.parent / 'src' / 'draft' / 'pool.gen.ts'

DEADLOCK_APP = 1422450

# The localization files with the heroes' names; the first holding a key wins.
NAME_GROUPS = ('citadel_heroes', 'citadel_gc_hero_names')


class AbilityType(StrEnum):
    SIGNATURE = 'EAbilityType_Signature'
    ULTIMATE = 'EAbilityType_Ultimate'


OFFERED_SLOTS = {
    'ESlot_Signature_1': AbilityType.SIGNATURE,
    'ESlot_Signature_2': AbilityType.SIGNATURE,
    'ESlot_Signature_3': AbilityType.SIGNATURE,
    'ESlot_Signature_4': AbilityType.ULTIMATE,
}


@dataclass
class PoolAbility:
    name: str
    icon: str


@dataclass
class PoolHero:
    name: str
    id: int
    title: str
    portrait: str
    abilities: list[PoolAbility]


def find_game():
    """Deadlock's folder, in whichever Steam library holds the game."""
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Software\Valve\Steam') as key:
        steam = Path(winreg.QueryValueEx(key, 'SteamPath')[0])
    folders = (steam / 'steamapps' / 'libraryfolders.vdf').read_text(encoding='utf-8')
    for library in re.findall(r'"path"\s+"([^"]+)"', folders):
        apps = Path(library.replace('\\\\', '\\')) / 'steamapps'
        manifest = apps / f'appmanifest_{DEADLOCK_APP}.acf'
        if manifest.exists():
            installdir = re.search(r'"installdir"\s+"([^"]+)"', manifest.read_text(encoding='utf-8')).group(1)
            return apps / 'common' / installdir
    sys.exit('Deadlock is in none of the Steam libraries; give its folder with --game')


def read_kv3(modlock, archive, path):
    out = subprocess.run([modlock, 'kv3', '--archive', archive, path], capture_output=True, check=True)
    return json.loads(out.stdout.decode('utf-8'))


def read_names(localization):
    """Every key of the name files, lower-cased, to its English text."""
    names = {}
    for group in NAME_GROUPS:
        for line in (localization / group / f'{group}_english.txt').read_text(encoding='utf-8-sig').splitlines():
            m = re.match(r'\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"', line)
            if m:
                names.setdefault(m.group(1).lower(), m.group(2).replace('\\"', '"'))
    return names


def hero_title(names, hero):
    # A hero's name sits under its own key or under key:n.
    return names.get(hero) or names.get(f'{hero}:n') or hero


def read_pool(heroes, abilities, names):
    pool = []
    for name, data in heroes.items():
        if not name.startswith('hero_'):
            continue
        if data.get('m_eHeroDevelopmentState') != 'EHeroDevState_Release':
            continue
        bound = data.get('m_mapBoundAbilities', {})
        offered = []
        for slot, expected in OFFERED_SLOTS.items():
            ability_name = bound.get(slot)
            ability_data = abilities.get(ability_name)
            if not isinstance(ability_data, dict):
                sys.exit(f'{name}: no data for {slot} {ability_name}')
            kind = ability_data.get('m_eAbilityType')
            if kind != expected:
                sys.exit(f'{name}: {ability_name} in {slot} is {kind}')
            offered.append(PoolAbility(ability_name, ability_data.get('m_strAbilityImage') or ''))
        portrait = data.get('m_strIconImageSmall') or ''
        pool.append(PoolHero(name, data.get('m_HeroID'), hero_title(names, name), portrait, offered))
    pool.sort(key=lambda hero: hero.title.lower())
    return pool


def pool_source(pool):
    table = json.dumps([asdict(hero) for hero in pool], ensure_ascii=False, indent=2)
    return '\n'.join([
        "import type { PoolHero } from './pool'",
        '',
        '/** Sorted by title, each with its four abilities. */',
        f'export const poolHeroes: readonly PoolHero[] = {table}',
        '',
    ])


def main():
    parser = argparse.ArgumentParser(description='Writes src/draft/pool.gen.ts from Deadlock\'s game files.')
    parser.add_argument('--modlock', default=os.environ.get('MODLOCK') or shutil.which('modlock'),
                        help='the Modlock command line; by default MODLOCK, else modlock on the PATH')
    parser.add_argument('--game', type=Path, help="Deadlock's folder; by default found in Steam's libraries")
    args = parser.parse_args()
    if not args.modlock:
        parser.error('Modlock was not found: give it with --modlock')
    citadel = (args.game or find_game()) / 'game' / 'citadel'
    archive = citadel / 'pak01_dir.vpk'
    heroes = read_kv3(args.modlock, archive, 'scripts/heroes.vdata_c')
    abilities = read_kv3(args.modlock, archive, 'scripts/abilities.vdata_c')
    names = read_names(citadel / 'resource' / 'localization')
    source = pool_source(read_pool(heroes, abilities, names))
    POOL_PATH.write_text(source, encoding='utf-8', newline='\n')
    print(f'{POOL_PATH}: {len(source.encode("utf-8")) // 1024} KB')


if __name__ == '__main__':
    main()
