import { type Child, log, type Player, show, type Style, type UiElement } from 'modlock'

import { type Draft, HERO_COLUMN, NO_SEAT, Phase, POOL_SIZE, type Seat, type Spot } from '../draft/draft'
import { drafted, heroCard, type PoolAbility, type PoolHero } from '../draft/pool'
import { AbilitySlot, REGULAR_ABILITIES } from '../draft/slots'
import { Team } from '../draft/teams'
import { COUNTDOWN_SECONDS, Sound } from './sounds'
import { teamName, Word } from './text'
import { Color, Dim, teamColor, teamTint } from './theme'

const ICON_SIZE = 56

/** Its icon in a 2 pixel frame. */
const CELL_WIDTH = ICON_SIZE + 4
const HEROES_PER_ROW = 3
const TEAM_WIDTH = 240
const CARD_WIDTH = 52
const CARD_HEIGHT = 70
const GROUP_GAP = 8
const COLUMN_GAP = 14
// 12 is the padding, 8 the card's 3 pixel frame and 2 pixel gap, 4 each ability's gap.
const GROUP_WIDTH = 12 + CARD_WIDTH + 8 + REGULAR_ABILITIES * (CELL_WIDTH + 4)
const CENTER_WIDTH = HEROES_PER_ROW * (GROUP_WIDTH + GROUP_GAP) + GROUP_GAP
const CONTENT_WIDTH = 2 * TEAM_WIDTH + CENTER_WIDTH + 2 * COLUMN_GAP
const ULTS_PER_ROW = Math.ceil(POOL_SIZE / 2)
/** As big as ULTS_PER_ROW of them fill the middle column, each in its 2 pixel frame with a 4 pixel gap. */
const ULT_ICON_SIZE = Math.floor(CENTER_WIDTH / ULTS_PER_ROW) - 8
const TURN_WIDTH = 40
const FACE_SIZE = 34
/** As many turns on each side of the current one as reach past the edges of a 1920 pixel wide screen. */
const QUEUE_SIDE = Math.ceil(1920 / 2 / TURN_WIDTH) + 1
const SLIDE_SECONDS = 0.35
/** The game refuses a bigger screen whole. */
const PANEL_LIMIT = 500
const PING_SIZE = 22
/** Two circles fit across an ability's icon. */
const PING_CIRCLES = 2
/** The game's own close cross, white, tinted and centered over each drafted hero and ability. */
const TAKEN_CROSS = 's2r://panorama/images/control_icons/24px/x_close.vsvg'
const LINE_HEIGHT = 1.3
const SEAT_CARD = { width: 46, height: 62, borderRadius: 4 }

export interface DraftActions {
  readonly press: (player: Player, spot: Spot) => void
  readonly ready: (player: Player) => void
}

interface DraftView extends DraftActions {
  readonly secondsLeft: number
  /** By ability game name, the player whose hero the game's ability window reads. */
  readonly tips: Readonly<Record<string, Player>>
}

interface BoardProps {
  readonly draft: Draft
  readonly mySeat: number
  readonly view: DraftView
}

interface AbilityButtonProps extends BoardProps {
  readonly spot: Spot
  readonly size?: number
}

interface HeroGroupProps extends BoardProps {
  readonly heroIndex: number
}

interface SizedStyle extends Style {
  readonly height: number
}

/** The order along the top gives up turns at its ends when the screen would hold too many panels. */
export function drawDraft(player: Player, draft: Draft, view: DraftView): void {
  const board = { draft, mySeat: draft.seatIndexOf(player.slot), view }
  let screen = draftScreen(board, QUEUE_SIDE)
  let panels = countPanels(screen)
  if (panels > PANEL_LIMIT) {
    // Each turn dropped from the order takes one face off each end: two panels.
    screen = draftScreen(board, Math.max(QUEUE_SIDE - Math.ceil((panels - PANEL_LIMIT) / 2), 1))
    panels = countPanels(screen)
  }
  if (panels > PANEL_LIMIT) {
    log(`draft: the screen holds ${panels} panels, past the ${PANEL_LIMIT} a player may be shown`)
  }
  show(player, screen)
}

/** A plain call, not a component: jsx wraps a component in a fragment, which would change every node id below it. */
function draftScreen(board: BoardProps, side: number): UiElement {
  const { draft } = board
  return (
    <panel style={{ width: '100%', height: '100%', background: Color.DraftShade }}>
      <panel style={{ width: '100%', flow: 'down', verticalAlign: 'center' }}>
        <Queue draft={draft} side={side} />
        <panel style={{ width: CONTENT_WIDTH, horizontalAlign: 'center', flow: 'right', margin: [12, 0, 0, 0] }}>
          <TeamBox draft={draft} team={Team.HiddenKing} />
          <panel style={{ width: CENTER_WIDTH, flow: 'down', margin: [0, COLUMN_GAP] }}>
            <Status {...board} />
            <Ultimates {...board} />
            <Board {...board} />
          </panel>
          <TeamBox draft={draft} team={Team.Archmother} />
        </panel>
      </panel>
    </panel>
  )
}

/** Each element and each loose text is a panel. */
function countPanels(child: Child): number {
  if (child === null || child === undefined || typeof child === 'boolean') {
    return 0
  }
  if (typeof child !== 'object') {
    return 1
  }
  if (!('props' in child)) {
    return child.reduce<number>((sum, c) => sum + countPanels(c), 0)
  }
  const inner = countPanels(child.props.children)
  return child.type === 'fragment' ? inner : 1 + (child.type === 'label' ? 0 : inner)
}

/**
 * Each pick scrolls the belt one turn left. A moved panel's place does not
 * ease, so each of the belt's three parts is a new panel each turn, which
 * starts one turn to the right, where its faces stood the turn before, and
 * slides into place. Every turn takes TURN_WIDTH pixels, so the faces line up.
 */
function Queue(props: { draft: Draft; side: number }) {
  const { draft, side } = props
  const { turn } = draft
  const taken = draft.order.slice(Math.max(0, turn - side), turn)
  const next = draft.order.slice(turn + 1, turn + 1 + side)
  const current = draft.order[turn]
  const enter = { translate: [TURN_WIDTH, 0] }
  const face = (seatIndex: number, at: number) => {
    const drafter = draft.seats[seatIndex]
    return (
      <Face
        key={at}
        seat={drafter}
        style={{
          width: FACE_SIZE, height: FACE_SIZE, verticalAlign: 'center',
          margin: [0, (TURN_WIDTH - FACE_SIZE) / 2], borderRadius: 4,
          borderWidth: 2, borderColor: teamColor(drafter.team),
          opacity: at < turn ? Dim.TakenTurn : 1,
        }}
      />
    )
  }
  return (
    <panel style={{ width: '100%', height: 48, flow: 'right', background: Color.QueueBar, overflow: 'clip' }}>
      <panel style={{ width: 'fill', height: '100%', overflow: 'show' }}>
        <panel
          key={`taken${turn}`}
          style={{
            height: '100%', flow: 'right', horizontalAlign: 'right', overflow: 'show', transition: SLIDE_SECONDS,
          }}
          enter={enter}
        >
          {taken.map((seatIndex, index) => face(seatIndex, turn - taken.length + index))}
        </panel>
      </panel>
      <panel
        style={{
          width: TURN_WIDTH, height: TURN_WIDTH, verticalAlign: 'center', borderRadius: 6,
          borderWidth: 2, borderColor: Color.TurnRed, background: Color.TurnRedFill, overflow: 'show',
        }}
      >
        {current === undefined ? null : (
          <panel
            key={`now${turn}`}
            style={{ width: '100%', height: '100%', overflow: 'show', transition: SLIDE_SECONDS }}
            enter={enter}
          >
            <Face
              seat={draft.seats[current]}
              style={{
                width: FACE_SIZE - 4, height: FACE_SIZE - 4,
                horizontalAlign: 'center', verticalAlign: 'center', borderRadius: 4,
              }}
            />
          </panel>
        )}
      </panel>
      <panel style={{ width: 'fill', height: '100%', overflow: 'show' }}>
        <panel
          key={`next${turn}`}
          style={{ height: '100%', flow: 'right', overflow: 'show', transition: SLIDE_SECONDS }}
          enter={enter}
        >
          {next.map((seatIndex, index) => face(seatIndex, turn + 1 + index))}
        </panel>
      </panel>
    </panel>
  )
}

function Face(props: { seat: Seat; style: SizedStyle }) {
  const { seat, style } = props
  if (seat.hero !== undefined) {
    return <image src={seat.hero.portrait} style={style} />
  }
  if (seat.steamId !== undefined && seat.steamId !== 0n) {
    return <avatar steamId={seat.steamId} style={style} />
  }
  return <QuestionMark style={style} size={20} />
}

function QuestionMark(props: { style: SizedStyle; size: number }) {
  const { style, size } = props
  return (
    <label
      style={{
        background: Color.Well, ...style,
        padding: [Math.max(0, (style.height - size * LINE_HEIGHT) / 2), 0, 0, 0],
        textAlign: 'center', fontSize: size, face: 'block', color: Color.Muted,
      }}
    >
      ?
    </label>
  )
}

/** The middle column sets the height, so the box ends where the board does. */
function TeamBox(props: { draft: Draft; team: Team }) {
  const { draft, team } = props
  const seats = draft.seats.map((seat, index) => ({ seat, index })).filter((s) => s.seat.team === team)
  return (
    <panel
      style={{
        width: TEAM_WIDTH, height: '100%', flow: 'down', padding: 8, borderRadius: 8, background: teamTint(team),
      }}
    >
      <label
        style={{
          fontSize: 16, bold: true, uppercase: true, letterSpacing: 1, color: teamColor(team),
          margin: [0, 0, 8, 2], shadow: true,
        }}
      >
        {teamName(team)}
      </label>
      {seats.map(({ seat, index }) => (
        <SeatCard
          key={seat.slot}
          seat={seat}
          active={draft.current() === index}
          ready={draft.phase === Phase.Preview && draft.ready.has(index)}
        />
      ))}
    </panel>
  )
}

function SeatCard(props: { seat: Seat; active: boolean; ready: boolean }) {
  const { seat, active, ready } = props
  let tag = seat.away ? ` · ${Word.Away}` : seat.bot ? ` · ${Word.Bot}` : ''
  if (ready) {
    tag += ` · ${Word.Ready}`
  }
  return (
    <panel
      style={{
        width: '100%', flow: 'right', margin: [0, 0, 6, 0], padding: 6, borderRadius: 6,
        background: active ? Color.CardOnTurn : Color.Card,
        borderWidth: 2, borderColor: active ? Color.TurnRed : Color.TurnRedClear,
      }}
    >
      {seat.hero === undefined
        ? <QuestionMark style={{ ...SEAT_CARD, borderWidth: 2, borderColor: Color.Edge }} size={30} />
        : <image src={heroCard(seat.hero)} style={SEAT_CARD} />}
      <panel style={{ width: 'fill', flow: 'down', margin: [0, 0, 0, 8] }}>
        {seat.hero === undefined ? null : (
          <label style={{ fontSize: 14, bold: true, uppercase: true, color: teamColor(seat.team) }}>
            {seat.hero.title}
          </label>
        )}
        <label style={{ fontSize: 13, color: seat.away ? Color.Muted : Color.Text }}>{seat.name + tag}</label>
        <panel style={{ flow: 'right', margin: [4, 0, 0, 0] }}>
          {seat.picks.map((ability, slot) => (
            <Slot key={slot} ability={ability} ultimate={slot === AbilitySlot.Ultimate} />
          ))}
        </panel>
      </panel>
    </panel>
  )
}

function Slot(props: { ability: PoolAbility | undefined; ultimate: boolean }) {
  const style = {
    width: 32, height: 32, margin: [0, 5, 0, 0], borderRadius: 4,
    background: Color.Well, borderWidth: 2, borderColor: props.ultimate ? Color.Ultimate : Color.Edge,
  }
  if (props.ability !== undefined) {
    return <image src={props.ability.icon} style={style} />
  }
  return <panel style={style} />
}

function Status(props: BoardProps) {
  const { draft, mySeat, view } = props
  const current = draft.current()
  const seat = draft.currentSeat()
  const studying = draft.phase === Phase.Preview && mySeat !== NO_SEAT
  const timed = draft.phase !== Phase.Done
  const urgent = timed && view.secondsLeft <= COUNTDOWN_SECONDS
  let status: string = Word.Preview
  let color = Color.Text
  if (!timed) {
    status = Word.Preparing
  } else if (seat !== undefined) {
    status = current === mySeat ? Word.YourTurn : `${Word.Picking}: ${seat.name}`
    color = current === mySeat ? Color.TurnRed : teamColor(seat.team)
  }
  return (
    <panel
      style={{
        width: '100%', height: 64, flow: 'right', background: Color.StatusBar, borderRadius: 8, padding: [0, 18],
      }}
    >
      <label style={{ width: 'fill', verticalAlign: 'center', fontSize: 26, bold: true, color, shadow: true }}>
        {status}
      </label>
      {studying && !draft.ready.has(mySeat) ? (
        <button
          style={{
            verticalAlign: 'center', margin: [0, 14, 0, 0], padding: [8, 26], borderRadius: 8,
            background: Color.Gold, borderWidth: 2, borderColor: Color.Gold,
          }}
          hover={{ background: Color.GoldHover }}
          onPress={view.ready}
          sound={Sound.Ready}
        >
          <label style={{ fontSize: 18, face: 'block', uppercase: true, color: Color.OnGold }}>
            {Word.Ready}
          </label>
        </button>
      ) : null}
      <label
        style={{
          width: 50, height: 50, verticalAlign: 'center', padding: [8, 0, 0, 0], borderRadius: 25,
          background: Color.Well, borderWidth: 3,
          borderColor: urgent ? Color.TimerRed : timed ? Color.Gold : Color.Edge,
          textAlign: 'center', fontSize: 24, face: 'block', color: urgent ? Color.TimerRed : Color.Text,
        }}
      >
        {timed ? String(view.secondsLeft) : ''}
      </label>
    </panel>
  )
}

function boardRows(board: readonly PoolHero[], perRow: number): number[][] {
  const rows: number[][] = []
  board.forEach((_, heroIndex) => {
    (rows[Math.floor(heroIndex / perRow)] ??= []).push(heroIndex)
  })
  return rows
}

function Ultimates(props: BoardProps) {
  return (
    <panel style={{ width: '100%', flow: 'down', margin: [14, 0, 6, 0] }}>
      {boardRows(props.draft.board, ULTS_PER_ROW).map((row, index) => (
        <panel key={index} style={{ flow: 'right', horizontalAlign: 'center', margin: [0, 0, 6, 0] }}>
          {row.map((heroIndex) => (
            <AbilityButton
              key={heroIndex}
              {...props}
              spot={{ heroIndex, column: AbilitySlot.Ultimate }}
              size={ULT_ICON_SIZE}
            />
          ))}
        </panel>
      ))}
    </panel>
  )
}

function Board(props: BoardProps) {
  return (
    <panel style={{ width: '100%', flow: 'down', margin: [6, 0, 0, 0] }}>
      {boardRows(props.draft.board, HEROES_PER_ROW).map((row, index) => (
        <panel key={index} style={{ flow: 'right', margin: [0, 0, 8, 0] }}>
          {row.map((heroIndex) => <HeroGroup key={heroIndex} {...props} heroIndex={heroIndex} />)}
        </panel>
      ))}
    </panel>
  )
}

function HeroGroup(props: HeroGroupProps) {
  const { heroIndex, ...board } = props
  const { draft, mySeat, view } = board
  const hero = draft.board[heroIndex]
  const owner = draft.heroTaker(hero)
  const spot: Spot = { heroIndex, column: HERO_COLUMN }
  const allowed = draft.mayTake(mySeat, spot)
  return (
    <panel
      style={{
        width: GROUP_WIDTH, flow: 'down', margin: [0, GROUP_GAP, 0, 0], padding: [4, 6], borderRadius: 6,
        background: Color.Card,
      }}
    >
      <label
        style={{
          fontSize: 13, bold: true, color: owner ? teamColor(owner.team) : Color.Text, margin: [0, 0, 3, 0],
        }}
      >
        {`${hero.title}${owner ? ` · ${owner.name}` : ''}`}
      </label>
      <panel style={{ flow: 'right' }}>
        <button
          style={{
            background: Color.ClearFill, margin: [0, 2, 0, 0], borderRadius: 6, borderWidth: 3,
            borderColor: owner ? teamColor(owner.team) : Color.ClearEdge,
          }}
          hover={owner ? undefined : { borderWidth: 3, borderColor: Color.Lit }}
          onPress={(player) => view.press(player, spot)}
        >
          <image
            src={heroCard(hero)}
            style={{
              width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 4,
              opacity: owner ? Dim.TakenHero : allowed || mySeat === NO_SEAT ? 1 : Dim.BlockedHero,
            }}
          />
          {owner ? takenCross(CARD_WIDTH) : null}
          {pingBadge(board, spot)}
        </button>
        {hero.abilities.slice(0, REGULAR_ABILITIES).map((_, column) => (
          <AbilityButton key={column} {...board} spot={{ heroIndex, column }} />
        ))}
      </panel>
    </panel>
  )
}

function AbilityButton(props: AbilityButtonProps) {
  const { draft, mySeat, view, spot } = props
  const size = props.size ?? ICON_SIZE
  const hero = draft.board[spot.heroIndex]
  const ability = hero.abilities[spot.column]
  const taker = draft.abilityTaker(ability)
  const allowed = draft.mayTake(mySeat, spot)
  const ultimate = spot.column === AbilitySlot.Ultimate
  const crossed = taker !== undefined || !drafted(ability)
  const tip = view.tips[ability.name]
  return (
    <button
      style={{
        margin: [0, 4, 0, 0], borderRadius: 6, background: Color.Well, borderWidth: 2,
        borderColor: taker ? teamColor(taker.team) : ultimate ? Color.Ultimate : Color.Edge,
      }}
      hover={crossed ? undefined : { borderWidth: 2, borderColor: Color.Lit }}
      ability={tip ? { name: ability.name, player: tip } : undefined}
      onPress={(player) => view.press(player, spot)}
    >
      <image
        src={ability.icon}
        style={{
          width: size, height: size, borderRadius: 4,
          opacity: crossed ? Dim.TakenAbility : allowed || mySeat === NO_SEAT ? 1 : Dim.BlockedAbility,
        }}
      />
      {crossed ? takenCross(size) : null}
      {pingBadge(props, spot)}
    </button>
  )
}

/**
 * The avatars of those on the viewer's team pinging spot, at its top right, as
 * Hearthstone shows a teammate's ping, in at most PING_CIRCLES circles: past
 * that, the first one's avatar and a count of the rest; nothing when none is. A
 * plain call, as takenCross is.
 */
function pingBadge({ draft, mySeat }: BoardProps, spot: Spot) {
  const team = draft.seats[mySeat]?.team
  const pingers = team === undefined ? [] : draft.pingersOf(spot, team)
  if (team === undefined || pingers.length === 0) {
    return null
  }
  const avatars = pingers.length <= PING_CIRCLES ? pingers.length : PING_CIRCLES - 1
  const more = pingers.length - avatars
  return (
    <panel style={{ flow: 'right', horizontalAlign: 'right', verticalAlign: 'top', margin: [2, 2, 0, 0] }}>
      {pingers.slice(0, avatars).flatMap((seat) => seat.steamId === undefined ? [] : [
        <avatar
          key={seat.slot}
          steamId={seat.steamId}
          style={{
            width: PING_SIZE, height: PING_SIZE, margin: [0, 0, 0, 2], borderRadius: PING_SIZE / 2,
            borderWidth: 2, borderColor: teamColor(seat.team),
          }}
        />,
      ])}
      {more > 0
        ? (
          <label
            style={{
              height: PING_SIZE, minWidth: PING_SIZE, margin: [0, 0, 0, 2], padding: [3, 5, 0, 5],
              borderRadius: PING_SIZE / 2, borderWidth: 2, borderColor: teamColor(team), background: Color.Well,
              fontSize: 12, bold: true, textAlign: 'center', color: teamColor(team),
            }}
          >
            {`+${more}`}
          </label>
        )
        : null}
    </panel>
  )
}

/** A plain call, not a component: jsx wraps a component in a fragment, which would change every node id below it. */
function takenCross(size: number) {
  return (
    <image
      src={TAKEN_CROSS}
      style={{ width: size, height: size, horizontalAlign: 'center', verticalAlign: 'center', tint: Color.TakenCross }}
    />
  )
}
