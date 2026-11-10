import { type Connection, type Player, show, type Style } from 'modlock'

import { BROKER_OPENINGS, BrokerOpening } from '../broker/broker'
import { Team, TEAM_SEATS } from '../draft/teams'
import { Sound } from './sounds'
import { teamName, Word } from './text'
import { Color, teamColor, teamTint } from './theme'

const TEAM_WIDTH = 430
const GUTTER = 18
const SEAT_ROW: Style = { width: '100%', height: 44, margin: [0, 0, 6, 0], borderRadius: 6 }

interface LobbyPerson {
  readonly slot: number
  readonly name: string
  readonly steamId: bigint
  readonly team: Team
  readonly ready: boolean
}

/**
 * Only takes a seat, since the game would not let a bot change its hero: it
 * joins the match once the picks end, with the hero it drafted.
 */
export interface SeatedBot {
  readonly name: string
  readonly team: Team
}

interface LobbyBot extends SeatedBot {
  /** The bot's place in the list, by which its button takes it out. */
  readonly index: number
}

interface LobbyState {
  readonly people: readonly LobbyPerson[]
  readonly bots: readonly LobbyBot[]
  /** Unset until every person is ready. */
  readonly startsIn?: number
  readonly broker: BrokerOpening
}

export interface LobbyActions {
  readonly join: (player: Player, team: Team) => void
  readonly addBot: (team: Team) => void
  readonly removeBot: (index: number) => void
  readonly toggleReady: (player: Player) => void
  readonly chooseBroker: (opening: BrokerOpening) => void
}

interface LobbyView extends LobbyState, LobbyActions {}

export interface LobbyRoom extends LobbyState {
  /** The same people as the game knows them. */
  readonly connections: readonly Connection[]
}

export function drawLobby(player: Player, view: LobbyView): void {
  const me = view.people.find((p) => p.slot === player.slot)
  const readyCount = view.people.filter((p) => p.ready).length
  const status = view.startsIn === undefined
    ? `${Word.Ready}: ${readyCount} / ${view.people.length}`
    : `${Word.AllReady} ${view.startsIn}`
  show(
    player,
    <panel style={{ width: '100%', height: '100%', background: Color.LobbyShade }}>
      <panel style={{ horizontalAlign: 'center', verticalAlign: 'center', flow: 'down' }}>
        {brokerButton(view.broker, view.chooseBroker)}
        <panel
          style={{
            width: 2 * TEAM_WIDTH + 3 * GUTTER, flow: 'down', padding: [22, GUTTER], background: Color.LobbyWindow,
            borderRadius: 10,
          }}
        >
          <label
            style={{
              horizontalAlign: 'center', fontSize: 30, face: 'block', uppercase: true,
              color: Color.Gold, shadow: true,
            }}
          >
            {Word.Title}
          </label>
          <label style={{ horizontalAlign: 'center', fontSize: 16, color: Color.Muted, margin: [2, 0, 14, 0] }}>
            {Word.ChooseTeam}
          </label>
          <panel style={{ flow: 'right', horizontalAlign: 'center' }}>
            <TeamColumn team={Team.HiddenKing} me={me} view={view} />
            <TeamColumn team={Team.Archmother} me={me} view={view} />
          </panel>
          <label
            style={{
              horizontalAlign: 'center', fontSize: 16, bold: view.startsIn !== undefined,
              color: view.startsIn === undefined ? Color.Muted : Color.Gold, margin: [16, 0, 8, 0],
            }}
          >
            {status}
          </label>
          {me === undefined
            ? <label style={{ horizontalAlign: 'center', fontSize: 16, color: Color.Muted }}>{Word.NoSeat}</label>
            : readyButton(me.ready, view.toggleReady)}
        </panel>
      </panel>
    </panel>,
  )
}

/**
 * When the Broker first opens, which anyone in the lobby may change: each
 * press takes the next choice. A plain call, as readyButton is.
 */
function brokerButton(chosen: BrokerOpening, onChoose: (opening: BrokerOpening) => void) {
  const next = BROKER_OPENINGS[(BROKER_OPENINGS.indexOf(chosen) + 1) % BROKER_OPENINGS.length]
  const shown = chosen === BrokerOpening.Never ? Word.BrokerNever : `${chosen} ${Word.Minutes}`
  return (
    <button
      style={{
        horizontalAlign: 'center', padding: [6, 16], margin: [0, 0, 12, 0], borderRadius: 6,
        background: Color.Card, borderWidth: 2, borderColor: Color.Edge,
      }}
      hover={{ background: Color.CardHover }}
      onPress={() => onChoose(next)}
    >
      <label style={{ horizontalAlign: 'center', fontSize: 15, uppercase: true, color: Color.Text }}>
        {`${Word.Broker}: ${shown}`}
      </label>
    </button>
  )
}

/** A plain call, not a component: jsx wraps a component in a fragment, which would change every node id below it. */
function readyButton(ready: boolean, onPress: (player: Player) => void) {
  return (
    <button
      style={{
        horizontalAlign: 'center', width: 320, padding: [12, 0], borderRadius: 8,
        background: ready ? Color.Card : Color.Gold, borderWidth: 2, borderColor: ready ? Color.Edge : Color.Gold,
      }}
      hover={{ background: ready ? Color.CardHover : Color.GoldHover }}
      onPress={onPress}
      sound={Sound.Ready}
    >
      <label
        style={{
          horizontalAlign: 'center', fontSize: 20, face: 'block', uppercase: true,
          color: ready ? Color.Text : Color.OnGold,
        }}
      >
        {ready ? Word.UnreadyButton : Word.Ready}
      </label>
    </button>
  )
}

function TeamColumn(props: { team: Team; me: LobbyPerson | undefined; view: LobbyView }) {
  const { team, me, view } = props
  const people = view.people.filter((p) => p.team === team)
  const bots = view.bots.filter((b) => b.team === team)
  const taken = people.length + bots.length
  const empty = Math.max(0, TEAM_SEATS - taken)
  const hasRoom = empty > 0
  const color = teamColor(team)
  return (
    <panel
      style={{
        width: TEAM_WIDTH, flow: 'down', margin: [0, GUTTER / 2], padding: 10, borderRadius: 8,
        background: teamTint(team),
      }}
    >
      <panel style={{ width: '100%', flow: 'right', margin: [0, 0, 8, 0] }}>
        <label
          style={{ width: 'fill', fontSize: 18, bold: true, uppercase: true, letterSpacing: 1, color, shadow: true }}
        >
          {teamName(team)}
        </label>
        <label style={{ fontSize: 16, color: Color.Muted }}>{`${taken} / ${TEAM_SEATS}`}</label>
      </panel>
      {people.map((p) => <PersonRow key={`p${p.slot}`} person={p} mine={p.slot === me?.slot} />)}
      {bots.map((b) => <BotRow key={`b${b.index}`} bot={b} onRemove={view.removeBot} />)}
      {Array.from({ length: empty }, (_, i) => (
        <label
          key={`e${i}`}
          style={{
            ...SEAT_ROW, padding: [12, 12, 0, 12], background: Color.OpenSeat,
            borderWidth: 1, borderColor: Color.OpenSeatEdge, fontSize: 14, color: Color.OpenSeatText,
          }}
        >
          {Word.OpenSeat}
        </label>
      ))}
      <panel style={{ flow: 'right', horizontalAlign: 'center', margin: [4, 0, 0, 0] }}>
        {me !== undefined && me.team !== team && hasRoom
          ? <SmallButton text={Word.JoinTeam} color={color} onPress={(player) => view.join(player, team)} />
          : null}
        {hasRoom
          ? <SmallButton text={Word.AddBot} color={Color.Text} onPress={() => view.addBot(team)} />
          : null}
      </panel>
    </panel>
  )
}

function PersonRow(props: { person: LobbyPerson; mine: boolean }) {
  const { person, mine } = props
  return (
    <panel
      style={{
        ...SEAT_ROW, flow: 'right', padding: [4, 10, 4, 4], background: Color.Card,
        borderWidth: 2, borderColor: mine ? Color.Gold : Color.GoldClear,
      }}
    >
      <avatar steamId={person.steamId} style={{ width: 32, height: 32, verticalAlign: 'center', borderRadius: 4 }} />
      <label
        style={{
          width: 'fill', verticalAlign: 'center', margin: [0, 0, 0, 10], fontSize: 16, bold: mine, color: Color.Text,
        }}
      >
        {mine ? `${person.name} (${Word.You})` : person.name}
      </label>
      <label
        style={{ verticalAlign: 'center', fontSize: 14, bold: true, color: person.ready ? Color.Green : Color.Muted }}
      >
        {person.ready ? Word.Ready : Word.Waiting}
      </label>
    </panel>
  )
}

function BotRow(props: { bot: LobbyBot; onRemove: (index: number) => void }) {
  const { bot, onRemove } = props
  return (
    <panel style={{ ...SEAT_ROW, flow: 'right', padding: [4, 6, 4, 4], background: Color.Card }}>
      <label
        style={{
          width: 32, height: 32, verticalAlign: 'center', padding: [8, 0, 0, 0], borderRadius: 4,
          background: Color.Well, textAlign: 'center', fontSize: 11, bold: true, color: Color.Muted,
        }}
      >
        {Word.BotTag}
      </label>
      <label style={{ width: 'fill', verticalAlign: 'center', margin: [0, 0, 0, 10], fontSize: 16, color: Color.Text }}>
        {bot.name}
      </label>
      <button
        style={{
          width: 30, height: 30, verticalAlign: 'center', borderRadius: 4,
          background: Color.Well, borderWidth: 1, borderColor: Color.Edge,
        }}
        hover={{ background: Color.RemoveBotHover }}
        onPress={() => onRemove(bot.index)}
      >
        <label
          style={{ horizontalAlign: 'center', verticalAlign: 'center', fontSize: 16, bold: true, color: Color.Muted }}
        >
          ×
        </label>
      </button>
    </panel>
  )
}

function SmallButton(props: { text: string; color: Color; onPress: (player: Player) => void }) {
  return (
    <button
      style={{
        margin: [0, 5], padding: [6, 14], borderRadius: 6, background: Color.Card,
        borderWidth: 2, borderColor: props.color,
      }}
      hover={{ background: Color.CardHover }}
      onPress={props.onPress}
      sound={Sound.Press}
    >
      <label style={{ fontSize: 15, bold: true, color: props.color }}>{props.text}</label>
    </button>
  )
}
