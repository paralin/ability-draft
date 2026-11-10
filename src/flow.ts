import { abilityBarPresses, addBot, hide, holdReload, log, type Player, players } from 'modlock'

import { Broker, setBrokerOpening } from './broker/broker'
import { Draft, type Entrant, NO_SEAT, Phase, pickBoard, type Seat, type Spot } from './draft/draft'
import { leftoverPicks } from './draft/leftovers'
import { heroById, NO_HERO, type PoolHero, poolHeroes } from './draft/pool'
import { isTeam } from './draft/teams'
import { Room } from './lobby/room'
import { WaitView } from './lobby/waiting'
import { grant, keepUpgrades, spawned } from './match/abilities'
import { sleepBots, toughenBots, wakeBots } from './match/bots'
import { HeroHold, MatchHold } from './match/holds'
import { ImbuingPurchases } from './match/imbuing'
import { matchStarted, startOnRopes } from './match/lanes'
import { LateArrivals } from './match/late'
import { matchOver } from './match/over'
import { connectedPeople, type HeroRead, HeroReads, playerAt } from './match/roster'
import { KeyUpgrades } from './match/upgrades'
import { clearHidden, forgetHidden, showGameHud } from './ui/hud'
import { Cues } from './ui/cues'
import { TooltipHelpers } from './ui/helper'
import { Painter } from './ui/painter'
import { TabSender } from './ui/tab'
import { Word } from './ui/text'

const HERO_WAIT_SECONDS = 20
/** How long the seats' bots wait for the tooltips' helpers to leave before they join anyway. */
const HELPERS_LEAVE_SECONDS = 3
const RETRY_SECONDS = 1
const READ_SECONDS = 0.5

/** Past the game's 64 player slots: these bots have no slot until they join after the draft. */
const SEATED_BOT_SLOT = 100

enum Stage {
  Lobby = 'lobby',
  Drafting = 'drafting',
  /**
   * The match made ready after the picks: the tooltips' helpers leave, since
   * the game makes no bot on a team of six and they fill team 3 until they
   * have left; the seats' bots join once the match has started again.
   */
  Preparing = 'preparing',
  /** The drafted heroes taking the field. */
  Heroes = 'heroes',
  Playing = 'playing',
  /**
   * From the game's end of the match until the next world: each person gets
   * the game's HUD back, since the game's own lobby shows the same HUD.
   */
  Over = 'over',
}

export class Flow {
  private stage: Stage = Stage.Lobby
  private draft: Draft | undefined
  /** The next draft's board, picked as the lobby opens, so that its tooltips' helpers come before the draft. */
  private nextBoard: PoolHero[] | undefined
  /** Whether the seats' bots joined the match; see playFrame. */
  private botsCalled = false
  private now = 0
  private stageStart = 0
  private readonly heroAskedAt = new Map<number, number>()
  /** By slot: when a drafter with no hero clicked the game's hero picker in the match; see giveClickedHeroes. */
  private readonly heroClickedAt = new Map<number, number>()
  private readonly generations = new Map<number, number>()
  private nextRead = 0
  private readonly room = new Room((slot) => this.tipHelpers.holds(slot))
  private readonly waitView = new WaitView()
  private readonly matchHold = new MatchHold()
  private readonly heroHold = new HeroHold()
  private readonly cues = new Cues()
  private readonly painter = new Painter()
  private readonly tabSender = new TabSender()
  private readonly broker = new Broker()
  private readonly imbuing = new ImbuingPurchases()
  private readonly upgrades = new KeyUpgrades()
  private readonly reads = new HeroReads()
  private readonly lateArrivals = new LateArrivals()
  private readonly tipHelpers = new TooltipHelpers()
  /** By slot: the upgrade bits bought on each key this match; see keepUpgrades. */
  private readonly bought = new Map<number, number[]>()

  /**
   * Forgets the previous world, which took its players' heroes and bots, and
   * lifts the input blocks, which a world change keeps. What outlives a
   * world: generations, stageStart, nextRead, the cues, and the painter's
   * version.
   */
  resetForWorld(): void {
    this.heroHold.reset()
    this.matchHold.release()
    holdReload(false)
    toughenBots()
    sleepBots()
    this.stage = Stage.Lobby
    this.draft = undefined
    this.nextBoard = undefined
    this.botsCalled = false
    this.painter.clear()
    clearHidden()
    this.upgrades.clear()
    for (const c of players()) {
      abilityBarPresses(c.player)
    }
    this.heroAskedAt.clear()
    this.heroClickedAt.clear()
    this.room.clear()
    this.waitView.clear()
    this.tabSender.clear()
    this.broker.clear()
    this.reads.clear()
    this.lateArrivals.clear()
    this.bought.clear()
    this.tipHelpers.forget()
  }

  frame(now: number): void {
    this.now = now
    this.followConnections()
    // Until the heroes take the field the match stands still: no clock, no
    // lanes, and nobody on the map.
    if (this.stage !== Stage.Playing && this.stage !== Stage.Over) {
      this.matchHold.hold()
      this.seatWaiting()
    }
    const draft = this.draft
    if (this.stage === Stage.Lobby || draft === undefined) {
      this.prepareBoard()
      if (this.room.advanceCountdown(this.now)) {
        this.begin()
      } else {
        this.drawLobby()
      }
      return
    }
    switch (this.stage) {
      case Stage.Drafting:
        this.tipHelpers.frame(this.now)
        this.advanceDraft(draft)
        return
      case Stage.Preparing:
        this.prepareMatch(draft)
        return
      case Stage.Heroes:
        this.awaitHeroes(draft)
        return
      case Stage.Playing:
        this.playFrame(draft)
        return
      case Stage.Over:
        this.painter.paintOver()
    }
  }

  /**
   * Every person waiting on a team and every seated bot drafts a hero: people
   * get theirs and the bots join with theirs once the picks end. Only the
   * lobby calls it, so a match keeps its heroes until the next world.
   */
  private begin(): void {
    const { entrants, excluded } = this.gatherEntrants()
    let board = this.nextBoard
    if (board === undefined || board.some((h) => excluded.has(h.id))) {
      // A hero someone brought to the map since the lobby opened leaves the
      // board, which is picked again with its helpers.
      this.tipHelpers.remove()
      board = pickBoard(excluded)
      this.tipHelpers.start(board)
    }
    this.nextBoard = undefined
    this.draft = new Draft(entrants, board, this.now)
    log(`draft: ${entrants.length} seats, board ${this.draft.board.map((h) => h.name).join(' ')}`)

    // Keep this build through the draft and the match it sets up: a reload
    // would forget the picks.
    holdReload(true)
    toughenBots()
    setBrokerOpening(this.room.brokerOpening())
    this.enter(Stage.Drafting)
    this.cues.start()
  }

  buyImbuingItem(player: Player, args: string): void {
    if (this.stage === Stage.Playing) {
      this.imbuing.request(player, args)
    }
  }

  /** trainorupgradeability: Alt with an ability's key, numbered from 1. */
  upgradeByKey(player: Player, args: string): void {
    if (this.stage === Stage.Playing) {
      this.upgrades.request(player, args, 1, this.now)
    }
  }

  /**
   * upgrade_ability, a click on the ability bar or its pips, and
   * upgrade_ability_in_field, such a click with Tab held: the slot numbered from 0.
   */
  upgradeBySlot(player: Player, args: string): void {
    if (this.stage === Stage.Playing) {
      this.upgrades.request(player, args, 0, this.now)
    }
  }

  /** A click on the ability bar's icon or pips in slot, which Modlock reports. */
  upgradeFromBar(player: Player, slot: number): void {
    if (this.stage === Stage.Playing) {
      this.upgrades.bar(player, slot, this.now)
    }
  }

  /** trainability: a click with Tab held that names the ability, bought in the slot that holds it. */
  upgradeByName(player: Player, args: string): void {
    if (this.stage !== Stage.Playing) {
      return
    }
    const name = args.trim()
    const held = player.abilities().find((a) => a.name === name)
    if (held === undefined) {
      log(`upgrade: ${name} of player ${player.slot}: not held`)
      return
    }
    this.upgrades.request(player, String(held.slot), 0, this.now)
  }

  /**
   * The mod claims the game's own selecthero: the draft gives every hero, so
   * the picker gives none. In the match a drafter still without a hero gets
   * the drafted one again, and one who arrives after the draft none; once the
   * match is over, nobody gets one.
   */
  heroCommand(player: Player): void {
    const pawn = player.pawn()
    const hasHero = pawn !== undefined && pawn.hero !== NO_HERO && isTeam(pawn.team)
    const seat = this.draft?.seatAt(player.slot)
    if (this.stage === Stage.Over) {
      return
    }
    if (this.stage !== Stage.Playing) {
      player.chat(Word.HeroInDraft)
    } else if (hasHero) {
      player.chat(Word.HeroLocked)
    } else if (seat?.hero !== undefined) {
      log(`draft: selecthero from player ${player.slot}: the drafted ${seat.hero.name} on team ${seat.team}`)
      this.heroClickedAt.set(player.slot, this.now)
    } else if (seat === undefined) {
      player.chat(Word.MatchStarted)
    }
  }

  /**
   * The board's tooltips read a helper bot for each of its heroes, so the
   * board is picked as the lobby opens and its helpers come one a frame from
   * then on; they take no seats and go with the picks, before the seats' bots
   * come.
   */
  private prepareBoard(): void {
    if (this.nextBoard === undefined) {
      this.nextBoard = pickBoard(this.gatherEntrants().excluded)
      this.tipHelpers.start(this.nextBoard)
    }
    this.tipHelpers.frame(this.now)
  }

  /** Those who draft, and the heroes on the map no draft may offer; the helpers count as neither. */
  private gatherEntrants(): { entrants: Entrant[]; excluded: Set<number> } {
    const entrants: Entrant[] = []
    const excluded = new Set<number>()
    for (const c of players()) {
      if (this.tipHelpers.holds(c.player.slot)) {
        continue
      }
      const team = this.room.teamOf(c.player.slot)
      const pawn = c.player.pawn()
      // One still loading, as after a reconnect, drafts too: followLeavers
      // marks their seat away, so the draft picks for them until they are back.
      if (!c.bot && team !== undefined) {
        entrants.push({ slot: c.player.slot, name: c.name, bot: false, team, steamId: c.steamId })
      } else if (pawn !== undefined) {
        // A hero already on the map, such as a bot from before, stays its own.
        excluded.add(pawn.hero)
      }
    }
    this.room.bots().forEach((s, i) => {
      entrants.push({ slot: SEATED_BOT_SLOT + i, name: s.name, bot: true, team: s.team })
    })
    return { entrants, excluded }
  }

  /** A player who joined again in a slot: their game dropped the mod's screen, so it is drawn from scratch. */
  private followConnections(): void {
    for (const c of connectedPeople()) {
      const known = this.generations.get(c.player.slot)
      if (known === c.generation) {
        continue
      }
      this.generations.set(c.player.slot, c.generation)
      if (known !== undefined) {
        hide(c.player)
        this.tabSender.forget(c.player.slot)
        this.painter.forget(c.player.slot)
        forgetHidden(c.player.slot)
        this.upgrades.forget(c.player.slot)
      }
    }
  }

  /**
   * In the lobby, puts each person on a team of the mod's, the smaller one with
   * a seat; with both teams full, they wait with no seat. The teams are made
   * there: one who arrives after the lobby gets no seat, watches the draft, and
   * watches the match as a spectator, see leaveLateOut. Each one waiting has the
   * game's team picker hidden, and one on a team sees their team's spot. They
   * stay as they joined, on no team of the game's and without a hero, where the
   * game keeps the view still and the cursor free; a spectator's camera would
   * fly and take the cursor. Modlock also hides the rest of the game's HUD
   * until the last pick.
   */
  private seatWaiting(): void {
    // One still loading, as after a reconnect, keeps their team; one gone
    // from the server does not.
    if (this.stage === Stage.Lobby) {
      this.room.forgetLeft(new Set(players().filter((c) => !c.bot).map((c) => c.player.slot)))
    }
    for (const c of connectedPeople()) {
      const slot = c.player.slot
      const seat = this.draft?.seatAt(slot)
      // In the heroes stage a seated person is getting their drafted hero.
      if (this.stage === Stage.Heroes && seat !== undefined) {
        continue
      }
      // With both teams full one waits with no seat, and in the lobby takes
      // the first that opens.
      const team = this.room.teamOf(slot) ?? seat?.team ?? (this.stage === Stage.Lobby ? this.room.openTeam() : undefined)
      if (team === undefined) {
        this.waitView.showSeatless(c)
        continue
      }
      this.room.seat(slot, team)
      this.waitView.show(c, team, this.now)
    }
  }

  private drawLobby(): void {
    // A press on a screen older than the stage comes back here.
    const inLobby = (act: () => void) => {
      if (this.stage === Stage.Lobby) {
        act()
      }
    }
    this.painter.paintLobby(this.room.view(this.now), {
      join: (player, team) => inLobby(() => this.room.join(player.slot, team)),
      addBot: (team) => inLobby(() => this.room.seatBot(team)),
      removeBot: (index) => inLobby(() => this.room.unseatBot(index)),
      toggleReady: (player) => inLobby(() => this.room.toggleReady(player.slot)),
      chooseBroker: (opening) => inLobby(() => this.room.chooseBroker(opening)),
    })
  }

  private advanceDraft(draft: Draft): void {
    this.heroHold.holdSeats(draft.seats)
    this.followLeavers(draft)
    if (draft.phase === Phase.Preview) {
      this.endPreview(draft)
    }
    // A turn that runs out picks at random; the board and the order show it.
    if (draft.phase === Phase.Picking && this.now >= draft.deadline) {
      draft.pickRandom(this.now)
      this.painter.invalidate()
    }
    this.cues.follow(draft, this.now)
    if (draft.phase === Phase.Done) {
      this.endPicks()
    }
    this.drawDraft(draft)
  }

  /**
   * The preview ends on time, or once every person still seated is ready, which
   * is at once when no person drafts.
   */
  private endPreview(draft: Draft): void {
    if (this.now >= draft.deadline) {
      draft.start(this.now)
    } else {
      draft.startIfReady(this.now)
    }
    if (draft.phase !== Phase.Preview) {
      this.painter.invalidate()
    }
  }

  private endPicks(): void {
    this.cues.end()
    // The game's HUD shows again at the last pick, which ends the draft.
    for (const c of players()) {
      if (!c.bot) {
        showGameHud(c.player)
      }
    }
    this.tipHelpers.remove()
    this.enter(Stage.Preparing)
  }

  /** The helpers leave a frame or more after their removal; the match waits for that, up to HELPERS_LEAVE_SECONDS. */
  private prepareMatch(draft: Draft): void {
    if (!this.tipHelpers.gone() && this.now - this.stageStart < HELPERS_LEAVE_SECONDS) {
      this.drawDraft(draft)
      return
    }
    this.enter(Stage.Heroes)
  }

  private followLeavers(draft: Draft): void {
    const roster = players()
    for (const seat of draft.seats) {
      // A seat's bot joins only after the draft, so it has no connection during it.
      if (seat.bot) {
        continue
      }
      const c = roster.find((r) => r.player.slot === seat.slot)
      if (!seat.away && (c === undefined || !c.ready)) {
        draft.leave(seat.slot, this.now)
        this.painter.invalidate()
      } else if (seat.away && c !== undefined && c.ready && !c.bot && c.steamId === seat.steamId) {
        draft.rejoin(seat.slot, this.now)
        this.painter.invalidate()
      }
    }
  }

  private ready(player: Player): void {
    const draft = this.draft
    if (draft?.phase !== Phase.Preview) {
      return
    }
    const seat = draft.seatIndexOf(player.slot)
    if (seat !== NO_SEAT) {
      draft.markReady(seat, this.now)
      this.painter.invalidate()
    }
  }

  /**
   * On one's turn a press picks; at any other time of the board it pings the
   * spot for one's team. The game's error sound answers a refused press.
   */
  private press(player: Player, spot: Spot): void {
    const draft = this.draft
    if (draft === undefined || (draft.phase !== Phase.Picking && draft.phase !== Phase.Preview)) {
      return
    }
    const seat = draft.seatIndexOf(player.slot)
    const done = draft.phase === Phase.Picking && seat === draft.current()
      ? draft.pick(seat, spot, this.now)
      : draft.ping(seat, spot)
    if (done) {
      this.painter.invalidate()
    } else {
      this.cues.refuse(player)
    }
  }

  private drawDraft(draft: Draft): void {
    // A press on a board older than the stage comes back to ready and press, which check the phase.
    this.painter.paintDraft(draft, this.now, {
      press: (p, spot) => this.press(p, spot),
      ready: (p) => this.ready(p),
    }, this.tipHelpers.tips())
  }

  /**
   * The seats' bots join with their drafted heroes once the game has started
   * its match again, so that its start does not put them on the people's
   * rope: they pick their own lanes and ride out. The seat moves to the bot's
   * slot so its abilities follow, granted as the bot's hero is read.
   */
  private callBots(draft: Draft): void {
    wakeBots()
    for (const seat of draft.seats) {
      if (!seat.bot || seat.hero === undefined) {
        continue
      }
      const bot = addBot({ name: seat.name, team: seat.team, hero: seat.hero.name })
      if (bot === undefined) {
        log(`draft: could not add the bot ${seat.name} with ${seat.hero.name}`)
        continue
      }
      seat.slot = bot.slot
    }
  }

  /** A seat whose hero never comes plays the hero it has. */
  private awaitHeroes(draft: Draft): void {
    let standing = true
    for (const seat of draft.seats) {
      const player = playerAt(seat.slot)
      if (seat.away || player === undefined) {
        continue
      }
      const pawn = player.pawn()
      // A bot joined with its drafted hero, so it only has to stand.
      if (!seat.bot && seat.hero !== undefined && pawn?.hero !== seat.hero.id) {
        standing = false
        if (this.askDue(seat.slot)) {
          player.selectHero(seat.hero.name, seat.team)
        }
      } else if (pawn === undefined || !spawned(pawn, () => player.abilities())) {
        standing = false
      }
    }
    this.heroHold.holdSeats(draft.seats)
    if (standing || this.now - this.stageStart > HERO_WAIT_SECONDS) {
      this.finish(draft)
      return
    }
    this.drawDraft(draft)
  }

  private finish(draft: Draft): void {
    this.letGoAndGrant(draft)
    this.room.clearTeams()
    this.waitView.restore()
    this.painter.releaseScreens()
    // A click on the ability bar sends the game nothing for a drafted ability.
    for (const c of players()) {
      if (!c.bot) {
        abilityBarPresses(c.player, (player, slot) => this.upgradeFromBar(player, slot))
      }
    }
    // The seats were let go above, so the holds still known are those of
    // drafters who left.
    this.heroHold.releaseLeftovers()
    // frame holds the match again while the stage is not playing, so the
    // match's hold ends together with the stage change below.
    this.matchHold.release()
    startOnRopes(draft.seats)
    this.botsCalled = false
    this.reads.clear()
    this.nextRead = this.now + READ_SECONDS
    this.enter(Stage.Playing)
  }

  private letGoAndGrant(draft: Draft): void {
    for (const seat of draft.seats) {
      const player = playerAt(seat.slot)
      if (player === undefined) {
        continue
      }
      this.heroHold.letGo(player)
      grant(player, seat.picks, player.abilities())
    }
  }

  /**
   * One hero is read each frame, in turn. Keeping its drafted abilities acts on
   * that fresh read alone, so nothing is granted twice from an older one, and a
   * changed read goes to the Tab screens and the ability bars at once. The
   * Broker follows the kept reads each READ_SECONDS.
   */
  private playFrame(draft: Draft): void {
    if (!this.botsCalled && matchStarted()) {
      this.botsCalled = true
      this.callBots(draft)
    }
    const next = this.reads.readNext()
    if (next !== undefined) {
      this.keepAbilities(draft, next.read)
      if (next.changed) {
        this.tabSender.send(this.reads.all(), this.bought)
      }
    }
    if (this.now >= this.nextRead) {
      this.nextRead = this.now + READ_SECONDS
      const heroes = this.reads.all()
      this.broker.follow(heroes)
      if (matchOver()) {
        log('draft: the match is over; the game gets its HUD back')
        this.enter(Stage.Over)
      }
    }
    this.giveClickedHeroes(draft)
    this.leaveLateOut(draft)
    this.painter.paintPlaying()
  }

  /**
   * A drafter's click in the game's hero picker brings their drafted hero.
   * Modlock keeps the hero clicked waiting for up to 5 seconds, though the mod
   * claims the click, and refuses selectHero meanwhile, so the drafted hero is
   * asked for each RETRY_SECONDS until it stands, for HERO_WAIT_SECONDS.
   */
  private giveClickedHeroes(draft: Draft): void {
    for (const [slot, clickedAt] of this.heroClickedAt) {
      const seat = draft.seatAt(slot)
      const player = playerAt(slot)
      if (seat?.hero === undefined || player === undefined || player.pawn()?.hero === seat.hero.id ||
        this.now - clickedAt > HERO_WAIT_SECONDS) {
        this.heroClickedAt.delete(slot)
      } else if (this.askDue(slot)) {
        player.selectHero(seat.hero.name, seat.team)
      }
    }
  }

  /** Those with no hero on a team who drafted no seat watch as spectators until the next match. */
  private leaveLateOut(draft: Draft): void {
    const fielded = new Set(this.reads.all().filter((h) => h.pawn.hero !== NO_HERO).map((h) => h.connection.player.slot))
    const waiting = connectedPeople().filter((c) => draft.seatAt(c.player.slot) === undefined && !fielded.has(c.player.slot))
    this.lateArrivals.follow(waiting)
  }

  private keepAbilities(draft: Draft, hero: HeroRead): void {
    const { connection: c, pawn, owned } = hero
    const seat = draft.seatAt(c.player.slot) ?? this.lateSeat(draft, hero)
    if (seat !== undefined && spawned(pawn, () => owned)) {
      grant(c.player, seat.picks, owned)
      const bought = this.bought.get(c.player.slot) ?? []
      this.bought.set(c.player.slot, bought)
      keepUpgrades(c.player, seat.picks, owned, bought)
    }
  }

  private lateSeat(draft: Draft, { connection: c, pawn }: HeroRead): Seat | undefined {
    // One who joined a team after the draft gets no hero; see leaveLateOut.
    if (pawn.hero === NO_HERO) {
      return undefined
    }
    const seat: Seat = {
      slot: c.player.slot,
      name: c.name,
      bot: c.bot,
      team: pawn.team,
      hero: heroById(pawn.hero) ?? poolHeroes[0],
      picks: leftoverPicks(draft),
      away: false,
    }
    draft.seats.push(seat)
    if (!c.bot) {
      c.player.chat(Word.LateJoin)
    }
    log(`draft: seated ${c.name} late with ${seat.picks.map((p) => p?.name).join(' ')}`)
    return seat
  }

  private askDue(slot: number): boolean {
    if (this.now - (this.heroAskedAt.get(slot) ?? -Infinity) < RETRY_SECONDS) {
      return false
    }
    this.heroAskedAt.set(slot, this.now)
    return true
  }

  private enter(stage: Stage): void {
    this.stage = stage
    this.stageStart = this.now
    this.painter.invalidate()
    log(`draft: stage ${stage}`)
  }
}
