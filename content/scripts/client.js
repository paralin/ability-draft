'use strict'

const context = $.GetContextPanel()

const SEARCH_LIMIT = 20000

/** Whether the layout still shows, so its loops stop with it. */
function alive() {
  return context.IsValid()
}

function gameHud() {
  for (let at = context; at; at = at.GetParent()) {
    if (at.paneltype === 'CitadelHud') {
      return at
    }
  }
  return null
}

/** The topmost panel above the layout, where the tooltips hang. */
function topRoot() {
  let at = context
  while (at.GetParent()) {
    at = at.GetParent()
  }
  return at
}

function childrenOf(panel) {
  const children = []
  for (let index = 0; index < panel.GetChildCount(); index++) {
    const child = panel.GetChild(index)
    if (child) {
      children.push(child)
    }
  }
  return children
}

/**
 * Every panel under root that wanted accepts, not looking inside those. It goes
 * level by level, so the shallow panels it is after turn up long before
 * SEARCH_LIMIT, however many panels the shop and the rest of the HUD hold
 * deeper down.
 */
function findAll(root, wanted) {
  const found = []
  const queue = [root]
  for (let next = 0; next < queue.length && next < SEARCH_LIMIT; next++) {
    for (const child of childrenOf(queue[next])) {
      if (wanted(child)) {
        found.push(child)
      } else {
        queue.push(child)
      }
    }
  }
  return found
}

function inOrder(root, depth, wanted) {
  const found = []
  const walk = (panel, levels) => {
    for (const child of childrenOf(panel)) {
      if (wanted(child)) {
        found.push(child)
      } else if (levels > 0) {
        walk(child, levels - 1)
      }
    }
  }
  walk(root, depth)
  return found
}

/** Whether every panel in list is still there, and there is one. */
function allValid(list) {
  return list.length > 0 && list.every((panel) => panel.IsValid())
}

/** The picture of an ability outside the pool, which the mod names as '' with no icon. */
const UNKNOWN_ICON = 's2r://panorama/images/hud/ping/ping_icon_question.vsvg'

/** The tooltip of such an ability on Tab. */
const UNKNOWN_TIP = '???'

// The game's own ability window, CitadelShowAbilityDetailsTooltip: it draws
// any ability by its id, in the player's language, reading its text and
// numbers off the hero of the player slot given, which must stand on the map.
// The draft board passes the slot of the helper bot the mod keeps for the
// ability's hero, the Tab screen each row's player's.

/** By ability game name, the slot the mod names for the draft board's ability windows, or null. */
let tipSlots = null

/** The game's id of a class name, as Modlock's itemId computes it: MurmurHash2 with the game's seed. */
function classId(name) {
  const m = 1540483477
  const byte = (at) => (at < name.length ? name.charCodeAt(at) & 0xff : 0)
  let h = (826366246 ^ name.length) >>> 0
  let i = 0
  for (; name.length - i >= 4; i += 4) {
    let k = (byte(i) | byte(i + 1) << 8 | byte(i + 2) << 16 | byte(i + 3) << 24) >>> 0
    k = Math.imul(k, m) >>> 0
    k = (k ^ k >>> 24) >>> 0
    k = Math.imul(k, m) >>> 0
    h = Math.imul(h, m) >>> 0
    h = (h ^ k) >>> 0
  }
  const rest = name.length - i
  if (rest >= 3) {
    h = (h ^ byte(i + 2) << 16) >>> 0
  }
  if (rest >= 2) {
    h = (h ^ byte(i + 1) << 8) >>> 0
  }
  if (rest >= 1) {
    h = (h ^ byte(i)) >>> 0
    h = Math.imul(h, m) >>> 0
  }
  h = (h ^ h >>> 13) >>> 0
  h = Math.imul(h, m) >>> 0
  return (h ^ h >>> 15) >>> 0
}

function showAbilityWindow(anchor, key, slot) {
  $.DispatchEvent('CitadelShowAbilityDetailsTooltip', anchor, classId(key), slot)
}

function hideAbilityWindow(anchor) {
  $.DispatchEvent('CitadelHideAbilityDetailsTooltip', anchor)
}

function bought(bits, tier) {
  return (bits & (1 << tier)) !== 0
}

// The picker: hidden while the mod asks, swept again in case the game shows
// it once more, and shown again once the mod stops asking. The draft board's
// buttons are watched only while it hides, through the lobby and draft.

const SWEEP_SECONDS = 0.25

let pickerHidden = false

let sweeping = false

function setPicker() {
  const hud = gameHud()
  const picker = hud ? hud.FindChildTraverse('join_team') : null
  if (picker) {
    picker.style.visibility = pickerHidden ? 'collapse' : null
  }
}

/** The HUD is hidden again only from this loop, so it relies on the picker staying hidden at least as long. */
function sweep() {
  sweeping = false
  if (!alive()) {
    return
  }
  setPicker()
  setHud()
  if (pickerHidden) {
    sweeping = true
    $.Schedule(SWEEP_SECONDS, sweep)
  }
}

// The game's HUD: hidden while the mod asks, and what showed comes back once it stops.

/** Marks a panel of the game's HUD this script keeps hidden: whether it showed. */
const HUD_MARK = 'ability_draft_hidden'

const HudMark = Object.freeze({ None: '', Shown: 'shown', Unseen: 'unseen' })

const KEPT_ID = /^(Modlock|Hyperline|TooltipManager$)/

const HUD_SEARCH_SWEEPS = 8

let hudHidden = false

let hiddenParts = []

let hudSweeps = 0

let hudRestored = false

/**
 * The panels of the game's HUD to hide: every panel beside the way down to what
 * stays, which is this layout, Modlock's and Hyperline's own panels and the
 * game's tooltips.
 */
function hudParts(hud) {
  const stays = findAll(hud, (panel) => KEPT_ID.test(panel.id))
  stays.push(context)
  const way = new Set()
  for (const panel of stays) {
    for (let at = panel; at && at !== hud; at = at.GetParent()) {
      way.add(at)
    }
  }
  const parts = []
  const walk = (parent) => {
    for (const child of childrenOf(parent)) {
      if (KEPT_ID.test(child.id) || child === context) {
        continue
      }
      if (way.has(child)) {
        walk(child)
      } else {
        parts.push(child)
      }
    }
  }
  walk(hud)
  return parts
}

/**
 * Hides the game's HUD while the mod asks, and brings back what showed once it
 * stops. It sets each panel's visible, as Hyperline does: a style's visibility
 * set back to null leaves a panel unseen until the game lays it out anew, as Tab
 * does. A mark on each panel holds whether it showed, so a script that loads
 * mid-draft brings back what this one hid; a panel the game shows meanwhile is
 * hidden again and comes back too.
 */
function setHud() {
  const hud = gameHud()
  if (!hud) {
    return
  }
  if (hudHidden) {
    hideHudParts(hud)
  } else if (!hudRestored) {
    restoreHudParts(hud)
  }
}

function hideHudParts(hud) {
  hudRestored = false
  if (!allValid(hiddenParts) || hudSweeps++ % HUD_SEARCH_SWEEPS === 0) {
    hiddenParts = hudParts(hud)
  }
  for (const panel of hiddenParts) {
    if (panel.visible) {
      panel.SetAttributeString(HUD_MARK, HudMark.Shown)
      panel.visible = false
    } else if (panel.GetAttributeString(HUD_MARK, HudMark.None) === HudMark.None) {
      panel.SetAttributeString(HUD_MARK, HudMark.Unseen)
    }
  }
}

function restoreHudParts(hud) {
  hudRestored = true
  hiddenParts = []
  for (const panel of hudParts(hud)) {
    // A panel that showed comes back. One that did not is left to the game,
    // since setting visible overrides its style sheets: gameplay_hud stays
    // collapsed until a player joins a team, by the rule .joined_team.
    const mark = panel.GetAttributeString(HUD_MARK, HudMark.None)
    if (mark !== HudMark.None) {
      panel.SetAttributeString(HUD_MARK, HudMark.None)
      if (mark === HudMark.Shown) {
        panel.visible = true
      }
    }
  }
}

// The Tab screen: the game's top bar, opened wide while Tab is held, shows
// each player's four abilities on its own read-only CitadelAbilityIcon panels,
// as the hero's standard ones. On each row the mod names a hero for, those icons
// are dressed as the drafted abilities: the game's picture is hidden and the
// drafted one laid in its place with the same class, so the game's styles draw
// it as they draw their own; the ring and the read-only pips follow the mod's
// upgrades; and the tooltip is the mod's on every part of the icon. The icons
// are dressed the first time Tab opens and stay so, which would leave them on
// the game's own lobby, the same HUD; so they go back as the match ends and as
// the player leaves, see leaving.

const ROWS_SECONDS = 2

const TOP_BAR_DEPTH = 6

const UPGRADE_TIERS = 3

/** A Tab row's four ability icons, in slot order. */
const ICONS = ['AbilityButton1', 'AbilityButton2', 'AbilityButton3', 'AbilityButton4']

/** The drafted ability's picture the mod lays over the game's in each icon. */
const DRAFT_IMAGE_ID = 'AbilityDraftImage'

const CELL_KEY = 'key'

/** The picture's src. */
const CELL_ICON = 'icon'

/** The row's player's slot, whose hero the game's ability window reads. */
const CELL_SLOT = 'slot'

const CELL_UPGRADES = 'upgrades'

const PIP_BORDER = '#00000099'

/**
 * The game's read-only pips, from its hud_ability_icon style sheet: black, and
 * its deadlockGreen once bought. The mod's pips on the bar take them too.
 */
const READ_ONLY_PIP_OFF = 'black'

const READ_ONLY_PIP_ON = '#69e799'

let tabHeroes = []

let teamPanels = []

let tabRows = []

/** In seconds, or 0 to match them at the next look. */
let rowsAt = 0

/**
 * True until what a script before this one left on Tab's icons is gone: its
 * hover handlers belong to that script, so this one makes them anew.
 */
let coversStale = true

/** Whether Tab's icons wear the drafted abilities now. */
let tabDressed = false

let watchingTab = false

function dialogVariable(row, name) {
  const value = $.Localize('{s:' + name + '}', row)
  return typeof value === 'string' && value.indexOf('{s:') < 0 ? value : ''
}

/**
 * Finds the top bar's rows and the hero the mod names for each: by the player's
 * name, or else by the hero's, which a bot's row shows in place of a name. The
 * HUD has more than one TeamsContainer, so the top bar's teams are found by their
 * type.
 */
function matchRows() {
  if (!allValid(teamPanels)) {
    // The game finds #TopBar itself, past however many panels the shop and
    // the rest of the HUD hold; a search of the whole HUD can run out first.
    const hud = gameHud()
    const top = hud ? hud.FindChildTraverse('TopBar') : null
    const isTeam = (panel) => panel.paneltype === 'CitadelHudTopBarTeam'
    teamPanels = top ? findAll(top, isTeam) : hud ? findAll(hud, isTeam) : []
  }
  const isPlayer = (panel) => panel.paneltype === 'CitadelHudTopBarPlayer'
  const found = teamPanels.flatMap((team) => inOrder(team, TOP_BAR_DEPTH, isPlayer))
  tabRows = found.flatMap((row) => {
    const box = row.FindChildTraverse('PlayerAbilitiesContainer')
    if (!box) {
      return []
    }
    if (coversStale) {
      deleteStaleCover(box)
    }
    return [{ box, picks: picksOf(row) }]
  })
  coversStale = coversStale && found.length === 0
}

function deleteStaleCover(box) {
  for (const id of ICONS) {
    const icon = box.FindChild(id)
    if (icon) {
      undressIcon(icon)
    }
  }
}

function picksOf(row) {
  const name = dialogVariable(row, 'player_name')
  const hero = dialogVariable(row, 'hero_name')
  return tabHeroes.find((each) => each.n === name) ||
    tabHeroes.find((each) => hero !== '' && $.Localize('#' + each.h) === hero) || null
}

/** The rows' icons have no height until Tab opens them. */
function tabHeld() {
  return tabRows.some((each) => each.box.IsValid() && each.box.actuallayoutheight > 0)
}

function coverTab() {
  const now = Date.now() / 1000
  if (rowsAt === 0 || now - rowsAt > ROWS_SECONDS || !tabRows.every((each) => each.box.IsValid())) {
    rowsAt = now
    matchRows()
  }
  if (!drawing() || tabHeroes.length === 0) {
    if (tabDressed) {
      undressTab()
    }
    return
  }
  if (!tabHeld()) {
    return
  }
  for (const each of tabRows) {
    dressRow(each.box, each.picks)
  }
  tabDressed = true
}

function undressTab() {
  for (const each of tabRows) {
    if (each.box.IsValid()) {
      deleteStaleCover(each.box)
    }
  }
  tabDressed = false
}

/** Every frame until Tab is dressed, so it is dressed as it first opens, not a tick later. */
function watchTab() {
  const wanted = drawing() && tabHeroes.length > 0
  if (alive() && ((wanted && !tabDressed && tabHeld()) || (!wanted && tabDressed))) {
    coverTab()
  }
  if (!alive() || tabDressed || tabHeroes.length === 0) {
    watchingTab = false
    return
  }
  $.Schedule(0, watchTab)
}

function updateAttribute(panel, key, value) {
  if (panel.GetAttributeString(key, '') === value) {
    return false
  }
  panel.SetAttributeString(key, value)
  return true
}

function dressRow(box, picks) {
  ICONS.forEach((id, slot) => {
    const icon = box.FindChild(id)
    if (!icon) {
      return
    }
    const held = picks && picks.a ? picks.a[slot] : null
    if (held) {
      dressIcon(icon, held[0] || '', held[1] | 0, held[2] || UNKNOWN_ICON, picks.s)
    } else {
      undressIcon(icon)
    }
  })
}

function dressIcon(icon, key, bits, picture, slot) {
  let image = icon.FindChildTraverse(DRAFT_IMAGE_ID)
  if (!image) {
    const own = icon.FindChildTraverse('ability_image')
    if (!own) {
      return
    }
    image = $.CreatePanel('Image', own.GetParent(), DRAFT_IMAGE_ID)
    image.AddClass('ability_image')
    image.SetScaling('stretch-to-fit-preserve-aspect')
    image.hittest = true
    own.style.opacity = '0'
    icon.hittest = false
    for (const part of partsOf(icon)) {
      part.SetPanelEvent('onmouseover', () => showTabTip(icon, image))
      part.SetPanelEvent('onmouseout', () => {
        hideAbilityWindow(icon)
        $.DispatchEvent('UIHideTextTooltip', icon)
      })
    }
  }
  updateAttribute(image, CELL_KEY, key)
  updateAttribute(image, CELL_SLOT, typeof slot === 'number' ? String(slot) : '')
  if (updateAttribute(image, CELL_ICON, picture)) {
    image.SetImage(picture)
  }
  if (updateAttribute(image, CELL_UPGRADES, String(bits))) {
    const ring = firstWithClass(icon, 'ability_ring')
    if (ring) {
      ring.style.visibility = tierOf(bits) > 0 ? 'visible' : 'collapse'
    }
  }
  drawReadOnlyPips(icon, bits)
}

/**
 * Every panel of a Tab icon, the icon with it: wherever the mouse rests there,
 * on the frame, a label or the pips, the game would show its tooltip for the
 * hero's own ability.
 */
function partsOf(icon) {
  const parts = []
  const stack = [icon]
  while (stack.length > 0) {
    const panel = stack.pop()
    parts.push(panel)
    stack.push(...childrenOf(panel))
  }
  return parts
}

/** Gives the icon back to the game, as for a row the mod names no hero for. */
function undressIcon(icon) {
  const image = icon.FindChildTraverse(DRAFT_IMAGE_ID)
  if (!image) {
    return
  }
  image.DeleteAsync(0)
  icon.hittest = true
  for (const part of partsOf(icon)) {
    part.ClearPanelEvent('onmouseover')
    part.ClearPanelEvent('onmouseout')
  }
  const own = icon.FindChildTraverse('ability_image')
  if (own) {
    own.style.opacity = null
  }
  const ring = firstWithClass(icon, 'ability_ring')
  if (ring) {
    ring.style.visibility = null
  }
  clearReadOnlyPips(icon)
}

function clearReadOnlyPips(icon) {
  const box = icon.FindChildTraverse('ReadOnlyPipsContainer')
  if (box) {
    box.SetAttributeString(DRAWN_KEY, '')
    for (let n = 1; n <= UPGRADE_TIERS; n++) {
      const pip = box.FindChildTraverse('Pip' + n)
      if (pip) {
        pip.style.backgroundColor = null
      }
    }
  }
}

/** The game's ability window for an ability of the pool on a row with a player, else UNKNOWN_TIP. */
function showTabTip(icon, cell) {
  const key = cell.GetAttributeString(CELL_KEY, '')
  const slot = cell.GetAttributeString(CELL_SLOT, '')
  if (key && slot !== '') {
    showAbilityWindow(icon, key, Number(slot))
  } else {
    $.DispatchEvent('UIShowTextTooltip', icon, UNKNOWN_TIP)
  }
}

// The ability bar: the game's own bottom bar, #hud_signature, shows the bought
// upgrades of each of its four CitadelAbilityIcon panels with the class Tier0
// to Tier3: a frame whose picture grows with them, a ring from the first, and a
// cooldown shade of the frame's shape. Each CitadelHudAbilityUpgradePips panel,
// shown while Tab is held or the bar hovered, shows a pip and a cost on each of
// its AbilityUnlock1..3, lit with the class hasAbilityUpgrade, and an icon
// may show read-only pips too. The game sets these classes from its own idea
// of the hero's abilities, which shows none for a drafted one, and sets them
// again as it likes. So the mod draws all of them from mine, in styles written
// on the panels themselves, which outrank any class: whatever the game sets,
// the bar shows the mod's upgrades, once the server reads the hero again: it
// reads one hero a frame, so each a few times a second. Each panel is written
// only when its upgrades change. The pictures and shapes are the game's own,
// from its hud_ability_icon style sheet. All of it goes back as the match ends
// and as the player leaves, see leaving.

/** How long a purchase holds the ability's key, long enough for the game to read it. */
const KEY_SECONDS = 0.05

const BAR_DEPTH = 8

const FRAME_IMAGES = 's2r://panorama/images/hud/core/'

/** Where the mod last drew a panel's upgrades, so it draws them again only when they change. */
const DRAWN_KEY = 'abilityDraftUpgrades'

/** A bar pip, flatter than the game's round one, like the read-only pips on Tab's icons. */
const BAR_PIP_WIDTH = '18px'

const BAR_PIP_HEIGHT = '6px'

const NO_WASH = '#00000000'

let mineUpgrades = []

let signature = null

let barIcons = []

/** Each bar icon's upgrade pips in slot order, or null where it has none yet. */
let barPips = []

function isPipRow(panel) {
  return panel.paneltype === 'CitadelHudAbilityUpgradePips'
}

function markBar() {
  if (!alive() || !drawing() || mineUpgrades.length === 0) {
    return
  }
  // The game makes a bar's pips some time after its icons, so a search that
  // found an icon without them looks again.
  const pipsKnown = barPips.every((pips) => pips && pips.IsValid())
  const barKnown = signature && signature.IsValid() && allValid(barIcons) && pipsKnown
  if (!barKnown && !findBar()) {
    return
  }
  barIcons.forEach((icon, slot) => {
    const pips = barPips[slot]
    const bits = mineUpgrades[slot] | 0
    drawFrame(icon, bits)
    drawReadOnlyPips(icon, bits)
    if (pips && pips.IsValid()) {
      drawPips(pips, bits)
    }
  })
}

function findBar() {
  const hud = gameHud()
  signature = hud ? hud.FindChildTraverse('hud_signature') : null
  if (!signature) {
    return false
  }
  // Each icon's id names its slot. The pips are hidden and have no place of
  // their own on the screen, so they go by where they sit, not by position.
  barIcons = inOrder(signature, BAR_DEPTH, (panel) => /^slot_signature_[1-4]$/.test(panel.id))
    .sort((a, b) => (a.id < b.id ? -1 : 1))
  const pipRows = inOrder(signature, BAR_DEPTH, isPipRow)
  barPips = barIcons.map((icon, slot) => pipsOf(icon) || pipRows[slot] || null)
  barIcons.forEach((icon, slot) => {
    listenForClicks(icon, slot)
    listenForClicks(barPips[slot], slot)
  })
  return true
}

function tierOf(bits) {
  let tier = 0
  for (let n = 1; n <= UPGRADE_TIERS; n++) {
    tier += bought(bits, n) ? 1 : 0
  }
  return tier
}

function firstWithClass(root, name) {
  return inOrder(root, BAR_DEPTH, (panel) => panel.BHasClass(name))[0] || null
}

/**
 * The frame's picture by tier, as the game's Tier rules set it: from the second
 * upgrade its own picture, before that the plain one or, for an ability with a
 * sub-ability, the one with room for it.
 */
function frameImage(tier, withSub) {
  const name = tier >= 2 ? 'ability_frame_passive_' + tier : withSub ? 'ability_frame_passive_withsub_0' : 'ability_frame_passive_0'
  return 'url("' + FRAME_IMAGES + name + '_psd.vtex")'
}

function drawFrame(icon, bits) {
  const tier = tierOf(bits)
  const withSub = icon.BHasClass('hasSubAbility')
  if (!updateAttribute(icon, DRAWN_KEY, tier + (withSub ? ' sub' : ''))) {
    return
  }
  const background = firstWithClass(icon, 'ability_bg')
  if (background) {
    background.style.backgroundImage = frameImage(tier, withSub)
  }
  const ring = firstWithClass(icon, 'ability_ring')
  if (ring) {
    ring.style.visibility = tier > 0 ? 'visible' : 'collapse'
  }
  const shade = icon.FindChildTraverse('cooldown_mask')
  if (shade) {
    shade.style.opacityMask = 'url("' + FRAME_IMAGES + 'ability_frame_' + tier + '.vsvg")'
  }
}

/**
 * The icon's own read-only pips, in the game's colors: shown on Tab's icons, and
 * on the bar only where the game's settings ask for them. Pip1 is the first upgrade.
 */
function drawReadOnlyPips(icon, bits) {
  const box = icon.FindChildTraverse('ReadOnlyPipsContainer')
  if (!box || !updateAttribute(box, DRAWN_KEY, String(bits))) {
    return
  }
  for (let n = 1; n <= UPGRADE_TIERS; n++) {
    const pip = box.FindChildTraverse('Pip' + n)
    if (pip) {
      pip.style.backgroundColor = bought(bits, n) ? READ_ONLY_PIP_ON : READ_ONLY_PIP_OFF
    }
  }
}

/**
 * Each upgrade's pip while Tab is held, drawn flat in the read-only pips' colors. The
 * game's cost under it, its lit background, its flash and its unlock button
 * are left out, since they follow the game's idea of the upgrades: Tab with the
 * ability's key or a click unlocks it. The game hides the pips in the button's
 * place while it takes the ability for one not yet unlocked, so the pips are
 * shown whatever it takes.
 */
function drawPips(pips, bits) {
  if (updateAttribute(pips, DRAWN_KEY, 'drawn')) {
    for (const id of ['TrainButton', 'LockedMsg']) {
      const part = pips.FindChildTraverse(id)
      if (part) {
        part.style.visibility = 'collapse'
      }
    }
    const row = pips.FindChildTraverse('AbilityUpgradePips')
    if (row) {
      row.style.visibility = 'visible'
      row.style.opacity = '1'
    }
  }
  for (let n = 1; n <= UPGRADE_TIERS; n++) {
    const unlock = pips.FindChildTraverse('AbilityUnlock' + n)
    if (!unlock || !updateAttribute(unlock, DRAWN_KEY, String(bits))) {
      continue
    }
    const on = bought(bits, n)
    unlock.style.backgroundColor = NO_WASH
    unlock.style.opacity = '1'
    const flash = firstWithClass(unlock, 'upgradeReadyFlash')
    if (flash) {
      flash.style.opacity = '0'
    }
    const pip = firstWithClass(unlock, 'abilityLevelPip')
    if (pip) {
      pip.style.backgroundImage = 'none'
      pip.style.washColor = NO_WASH
      pip.style.opacity = '1'
      pip.style.width = BAR_PIP_WIDTH
      pip.style.height = BAR_PIP_HEIGHT
      pip.style.borderRadius = '2px'
      pip.style.border = '1px solid ' + PIP_BORDER
      pip.style.backgroundColor = on ? READ_ONLY_PIP_ON : READ_ONLY_PIP_OFF
    }
    const cost = firstWithClass(unlock, 'abilityUpgradeCostLabel')
    if (cost) {
      cost.style.visibility = 'collapse'
    }
  }
}

/** Gives the bar back to the game: every style the mod set on it goes. */
function unmarkBar() {
  barIcons.forEach((icon, slot) => {
    if (icon.IsValid()) {
      clearFrame(icon)
      clearReadOnlyPips(icon)
    }
    const pips = barPips[slot]
    if (pips && pips.IsValid()) {
      clearPips(pips)
    }
  })
}

function clearFrame(icon) {
  icon.SetAttributeString(DRAWN_KEY, '')
  const background = firstWithClass(icon, 'ability_bg')
  if (background) {
    background.style.backgroundImage = null
  }
  const ring = firstWithClass(icon, 'ability_ring')
  if (ring) {
    ring.style.visibility = null
  }
  const shade = icon.FindChildTraverse('cooldown_mask')
  if (shade) {
    shade.style.opacityMask = null
  }
}

function clearPips(pips) {
  pips.SetAttributeString(DRAWN_KEY, '')
  for (const id of ['TrainButton', 'LockedMsg']) {
    const part = pips.FindChildTraverse(id)
    if (part) {
      part.style.visibility = null
    }
  }
  const row = pips.FindChildTraverse('AbilityUpgradePips')
  if (row) {
    row.style.visibility = null
    row.style.opacity = null
  }
  for (let n = 1; n <= UPGRADE_TIERS; n++) {
    const unlock = pips.FindChildTraverse('AbilityUnlock' + n)
    if (!unlock) {
      continue
    }
    unlock.SetAttributeString(DRAWN_KEY, '')
    unlock.style.backgroundColor = null
    unlock.style.opacity = null
    const flash = firstWithClass(unlock, 'upgradeReadyFlash')
    if (flash) {
      flash.style.opacity = null
    }
    const pip = firstWithClass(unlock, 'abilityLevelPip')
    if (pip) {
      for (const name of ['backgroundImage', 'washColor', 'opacity', 'width', 'height', 'borderRadius', 'border', 'backgroundColor']) {
        pip.style[name] = null
      }
    }
    const cost = firstWithClass(unlock, 'abilityUpgradeCostLabel')
    if (cost) {
      cost.style.visibility = null
    }
  }
}

function pipsOf(icon) {
  const inside = inOrder(icon, BAR_DEPTH, isPipRow)
  if (inside.length > 0) {
    return inside[0]
  }
  const parent = icon.GetParent()
  const beside = parent ? inOrder(parent, BAR_DEPTH, isPipRow) : []
  return beside.length === 1 ? beside[0] : null
}

// The draft board's ability windows: the game's own ability window opens at a
// board ability's button while the mouse is over it, once the mod names a slot
// for it, and closes as the mouse leaves. This runs every frame, but only
// through the lobby and the draft, and looks at the buttons only when the
// mouse moves or the slots change.

let watching = false

/**
 * The board's ability buttons wear this class followed by the ability's game
 * name, as src/ui/board.tsx names it.
 */
const ABILITY_CLASS = 'ad-ability-'

/** A button not found is looked for again after this long. */
const BUTTON_SEARCH_SECONDS = 1

/** The board's button the game's ability window stands beside, while it shows. */
let boardWindow = null

/** The game name of the ability whose window shows, or ''. */
let boardWindowKey = ''

/** Board buttons by ability name, as found: { panel, at }, panel null when not found at seconds at. */
const boardButtons = new Map()

/** Where the mouse stood at the last look, or '' to look again. */
let lastMouse = ''

function boardButton(key) {
  const now = Date.now() / 1000
  const known = boardButtons.get(key)
  if (known && (known.panel ? known.panel.IsValid() : now - known.at < BUTTON_SEARCH_SECONDS)) {
    return known.panel
  }
  const screen = context.GetParent() || context
  const panel = findAll(screen, (each) => each.BHasClass(ABILITY_CLASS + key))[0] || null
  boardButtons.set(key, { panel, at: now })
  return panel
}

/** Whether mouse is over the panel; its position and its laid-out size are both in the window's pixels. */
function mouseOver(panel, mouse) {
  const at = panel.GetPositionWithinWindow()
  if (!at) {
    return false
  }
  return mouse.x >= at.x && mouse.x < at.x + panel.actuallayoutwidth && mouse.y >= at.y && mouse.y < at.y + panel.actuallayoutheight
}

/** The game name of the board ability with a slot under mouse, or ''. */
function abilityUnder(mouse) {
  for (const key of Object.keys(tipSlots || {})) {
    const button = typeof tipSlots[key] === 'number' ? boardButton(key) : null
    if (button && mouseOver(button, mouse)) {
      return key
    }
  }
  return ''
}

function closeBoardWindow() {
  if (boardWindow && boardWindow.IsValid()) {
    hideAbilityWindow(boardWindow)
  }
  boardWindow = null
  boardWindowKey = ''
}

function watchBoard() {
  if (!alive() || !pickerHidden) {
    closeBoardWindow()
    lastMouse = ''
    watching = false
    return
  }
  // A button drawn anew is looked for again.
  if (boardWindow && !boardWindow.IsValid()) {
    lastMouse = ''
  }
  const mouse = $.MousePosition()
  const where = mouse ? mouse.x + ',' + mouse.y : ''
  if (where !== lastMouse) {
    lastMouse = where
    const key = mouse ? abilityUnder(mouse) : ''
    if (key !== boardWindowKey || (key && !boardWindow.IsValid())) {
      closeBoardWindow()
      if (key) {
        boardWindow = boardButton(key)
        boardWindowKey = key
        showAbilityWindow(boardWindow, key, tipSlots[key])
      }
    }
  }
  $.Schedule(0, watchBoard)
}

// The sounds: each numbered, played once in order. The first list the layout
// reads is only noted, so a layout made anew does not play old sounds.

let heard = -1

function playNew(played) {
  const newest = played.reduce((most, each) => Math.max(most, each.n | 0), 0)
  if (heard < 0) {
    heard = newest
    return
  }
  for (const each of played) {
    if ((each.n | 0) <= heard || typeof each.s !== 'string') {
      continue
    }
    const playing = PlayUISoundEvent(each.s)
    if (each.t > 0) {
      $.Schedule(each.t, () => StopUISoundEvent(playing))
    }
  }
  heard = Math.max(heard, newest)
}

/** The number of the newest purchase made, so a route read again does not repeat it. */
let lastBuy = 0

function buy(value) {
  if (!value || typeof value.item !== 'string' || !(value.order > lastBuy)) {
    return
  }
  lastBuy = value.order
  $.DispatchEvent('CitadelConCommand', 'buyitem ' + value.item + ' ' + value.source)
}

/** The newest upgrade order sent, so each is sent once. */
let lastUpgrade = 0

/** An ability key. */
const KEY_UPGRADE = /^in_ability[1-4]$/

/** How long the Tab screen is held before and after the key, for the game to read them in order. */
const TAB_SECONDS = 0.05

/**
 * Presses key as a held Tab with that key does, which buys the ability on it.
 * The script holds Tab itself even when the player's Tab looks open: the
 * player may let go of it before the mod's answer comes, and the key alone
 * casts the ability. Letting go of the script's Tab closes the player's too.
 */
function pressWithTab(key) {
  const send = (line) => $.DispatchEvent('CitadelConCommand', line)
  send('+show_scoreboard')
  $.Schedule(TAB_SECONDS, () => {
    send('+' + key)
    $.Schedule(KEY_SECONDS, () => {
      send('-' + key)
      $.Schedule(TAB_SECONDS, () => send('-show_scoreboard'))
    })
  })
}

/**
 * Alt with an ability's key, or a click on the ability bar, which the mod
 * claims and answers with the key of the ability to buy. A key this script
 * pressed for a click a moment ago is the answer to that click, already
 * pressed.
 */
function upgrade(value) {
  if (!Array.isArray(value)) {
    return
  }
  for (const [order, line] of value) {
    if (!(order > lastUpgrade)) {
      continue
    }
    if (KEY_UPGRADE.test(line)) {
      lastUpgrade = order
      if (Date.now() / 1000 - (clickedAt[line] || 0) >= CLICK_ANSWER_SECONDS) {
        pressWithTab(line)
      }
    }
  }
}

/** When this script last pressed each key for a click on the bar, in seconds. */
const clickedAt = {}

/** How long after a click the mod's answer to it may come. */
const CLICK_ANSWER_SECONDS = 1

/** A click reaches an icon and the pips inside it alike; a second within this is the same click. */
const SAME_CLICK_SECONDS = 0.2

/** Marks a bar panel this script listens on for clicks. */
const CLICK_KEY = 'ad-click'

/**
 * A click on the bar's icon or its pips, with Alt or Tab held, buys the
 * ability in that slot. The game answers such a click from the hero's own
 * abilities, which buys the wrong one or sends nothing at all for a drafted
 * one, so the script presses the slot's key with Tab itself. The listeners stay
 * on the game's panels, so they do nothing once the script stops drawing.
 */
function listenForClicks(panel, slot) {
  if (!panel || !panel.IsValid() || panel.GetAttributeString(CLICK_KEY, '') === 'on') {
    return
  }
  panel.SetAttributeString(CLICK_KEY, 'on')
  $.RegisterEventHandler('Activated', panel, () => {
    const key = 'in_ability' + (slot + 1)
    const now = Date.now() / 1000
    if (!drawing() || now - (clickedAt[key] || 0) < SAME_CLICK_SECONDS) {
      return
    }
    clickedAt[key] = now
    pressWithTab(key)
  })
}

// The Broker's window counts down to when he leaves, a time the game no longer
// sets, so it would read 34 days. That line stays hidden.

/** The HUD's panel the game marks while the player stands at his booth, kept until the game rebuilds it. */
let contextActions = null

/** Looked for only while the player stands at his booth. */
let brokerCountdown = null

function hideBrokerCountdown() {
  if (!contextActions || !contextActions.IsValid()) {
    const hud = gameHud()
    contextActions = hud ? hud.FindChildTraverse('context_action_container') : null
  }
  if ((!brokerCountdown || !brokerCountdown.IsValid()) && contextActions && contextActions.BHasClass('in_corrupted_shop_zone')) {
    const content = topRoot().FindChildTraverse('ModsCorruptContainer')
    brokerCountdown = content ? content.FindChildTraverse('Countdown') : null
  }
  if (brokerCountdown && brokerCountdown.IsValid() && brokerCountdown.visible) {
    brokerCountdown.visible = false
  }
}

/** True once the mod says the match is over; see the over route. */
let matchOver = false

/** True once the player leaves the server; see leaving. */
let left = false

/** Whether the script still draws on the game's HUD: not once the match is over or the player leaves. */
function drawing() {
  return !matchOver && !left
}

/**
 * Gives the game's HUD back as it was: Tab's icons, the ability bar, the
 * Broker's countdown and the draft board's window. The game's own lobby shows
 * the same HUD, and once the player leaves for it this script is gone.
 */
function releaseHud() {
  undressTab()
  unmarkBar()
  if (brokerCountdown && brokerCountdown.IsValid()) {
    brokerCountdown.visible = true
  }
  brokerCountdown = null
  closeBoardWindow()
}

/**
 * The player leaves the mod's server: the game's menu sends
 * CitadelDisconnectFromGame as the player asks to leave, and the game shuts its
 * systems down, GameSystemGameShutdown, as it leaves the map; Hyperline takes
 * this layout away only later, on CitadelHideoutConnectionUpdated, which is
 * left alone here, since the hideout may send it at other times. Leaving by
 * the menu, these reach this layout while it still runs; a server that just
 * goes away reaches it by none. The game's own lobby shows the same HUD, so
 * whichever comes first gives the game everything back: what releaseHud gives,
 * the hidden HUD and the picker; and the script draws no more, since the
 * layout still runs a moment in the game's lobby, where the tick would draw it
 * all again. Returns false, so the event goes on to Hyperline's own handler.
 */
function leaving() {
  if (alive() && !left) {
    left = true
    hudHidden = false
    pickerHidden = false
    releaseHud()
    const hud = gameHud()
    if (hud) {
      restoreHudParts(hud)
    }
    const picker = hud ? hud.FindChildTraverse('join_team') : null
    if (picker) {
      picker.style.visibility = null
    }
    $.Msg('[ability-draft] gave the game its HUD back on leaving')
  }
  return false
}

const TICK_SECONDS = 0.25

function tick() {
  if (!alive()) {
    return
  }
  if (tabHeroes.length > 0 || tabDressed) {
    coverTab()
  }
  markBar()
  if (drawing()) {
    hideBrokerCountdown()
  }
  $.Schedule(TICK_SECONDS, tick)
}

/** The routes src/ui/client.tsx sends; this script cannot import its enum. */
const Route = Object.freeze({
  Hud: 'hud', Picker: 'picker', Sounds: 'sounds', Tab: 'tab', Mine: 'mine', Buy: 'buy', Upgrade: 'upgrade', TipSlots: 'tipSlots',
  Over: 'over',
})

/**
 * Listens on a route. The layout may outlive a session, as Modlock's
 * development mode keeps it from one server to the next, and a map's shutdown
 * as the game loads its own lobby counts as leaving; so a value from the mod,
 * which comes only from its server, means the player is back, and the script
 * draws again.
 */
function onRoute(name, handler) {
  Modlock.route(name, (value) => {
    if (value !== undefined && value !== null) {
      left = false
    }
    handler(value)
  })
}

// The wiring: each handler runs right here, so nothing is declared below this line.

onRoute(Route.Hud, (value) => {
  hudHidden = value === true
  // The HUD hides only before a match, so a match over is one gone by.
  if (hudHidden) {
    matchOver = false
  }
  if (alive()) {
    setHud()
  }
})

onRoute(Route.Picker, (value) => {
  pickerHidden = value === true
  if (!sweeping) {
    sweep()
  }
  if (pickerHidden && !watching) {
    watching = true
    $.Schedule(0, watchBoard)
  }
})

onRoute(Route.Sounds, (value) => playNew(value && Array.isArray(value.played) ? value.played : []))

onRoute(Route.Buy, buy)

onRoute(Route.Upgrade, upgrade)

onRoute(Route.Tab, (value) => {
  tabHeroes = Array.isArray(value) ? value : []
  rowsAt = 0
  if (!watchingTab && tabHeroes.length > 0) {
    watchingTab = true
    $.Schedule(0, watchTab)
  }
})

onRoute(Route.Mine, (value) => {
  mineUpgrades = value && Array.isArray(value.u) ? value.u : []
  $.Schedule(0, markBar)
})

onRoute(Route.Over, (value) => {
  matchOver = value === true
  if (matchOver && alive()) {
    releaseHud()
  }
})

onRoute(Route.TipSlots, (value) => {
  tipSlots = value && typeof value === 'object' ? value : null
  lastMouse = ''
})

$.RegisterForUnhandledEvent('CitadelDisconnectFromGame', leaving)

$.RegisterForUnhandledEvent('GameSystemGameShutdown', leaving)

tick()
