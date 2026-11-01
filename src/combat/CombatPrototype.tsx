import { useEffect, useRef, useState } from "react";
import {
  activateAbility,
  chooseUpgrade,
  createCombat,
  distance,
  nearbyStation,
  objective,
  restoreRelay,
  respawn,
  ROLES,
  startBoss,
  STATIONS,
  stepCombat,
  walkable,
  type Point,
  type RoleId,
  type StationId,
} from "./engine";
import { draw, screenPoint } from "./render";
import "./combat.css";
type Props = { name: string; avatar: string; role: RoleId; onExit: () => void };
type Question = {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};
const QUESTIONS: Record<"marketing" | "tech" | "service", Question[]> = {
  marketing: [
    {
      prompt:
        "The east exit is blocked, but a verified west route is open. Students, staff and families are receiving different messages. Your relay has room for one alert. What do you send?",
      options: [
        "Lead with the verified west route, identify who should use it, and name the official update channel.",
        "Publish the complete incident timeline first so everyone understands how the situation developed.",
        "Send “Avoid the east exit” immediately, then wait for every detail before suggesting a route.",
      ],
      correct: 0,
      explanation:
        "The audience needs an action it can take now, backed by a verified source. A useful alert names the safe route and a next step.",
    },
  ],
  tech: [
    {
      prompt:
        "A relay repair request arrives from an unfamiliar account. It asks for administrator access, while students are waiting for the network. Which response best balances speed and security?",
      options: [
        "Grant temporary administrator access, then investigate after the route is restored.",
        "Verify the requester through the approved channel and use the authorized recovery procedure.",
        "Forward the request to every staff member and wait for someone to recognize the account.",
      ],
      correct: 1,
      explanation:
        "Verify identity and follow the recovery process. Urgency does not establish authorization. An unfamiliar account must be verified before access is granted.",
    },
  ],
  service: [
    {
      prompt:
        "Two survivors need your last portable charger: one is contacting emergency support, the other is updating friends. Both arrived together. How do you handle it?",
      options: [
        "Divide charging time equally without asking how much power either device needs.",
        "Give it to whoever asks most urgently to avoid delaying the line.",
        "Clarify each need, prioritize the emergency call, and give the other survivor a realistic alternative.",
      ],
      correct: 2,
      explanation:
        "Clarifying needs makes a fair, practical solution possible. The desk shares a charged power pack.",
    },
    {
      prompt:
        "A survivor says your promised supply pack was never delivered. Your stock log is incomplete. What should you do first?",
      options: [
        "Acknowledge the missed delivery, verify the order, and agree on a realistic next step.",
        "Promise an immediate replacement before checking remaining stock.",
        "Explain that another shift handled the order and direct them to that team.",
      ],
      correct: 0,
      explanation:
        "Take ownership of the next step, verify the facts, and set an achievable expectation.",
    },
  ],
};
const UPGRADES = [
  {
    id: "damage",
    icon: "↗",
    name: "Heavy textbooks",
    detail: "+8 damage per hit. Clear tougher enemies faster.",
  },
  {
    id: "rapid",
    icon: "»",
    name: "Quick release",
    detail: "Fire 0.08 seconds faster. Keep the crowd back.",
  },
  {
    id: "speed",
    icon: "⌁",
    name: "Travel light",
    detail: "+20 movement speed. Escape the closing crowd.",
  },
  {
    id: "magnet",
    icon: "✦",
    name: "Supply magnet",
    detail: "+80 pickup range and recover 25 health.",
  },
] as const;
type Modal = "briefing" | "pause" | "station" | "upgrade" | null;
export default function CombatPrototype({ name, avatar, role, onExit }: Props) {
  const state = useRef(createCombat(role)),
    canvas = useRef<HTMLCanvasElement>(null),
    keys = useRef(new Set<string>());
  const modalRef = useRef<Modal>("briefing"),
    stationRef = useRef<StationId | null>(null),
    destination = useRef<Point | null>(null);
  const [view, setView] = useState(() => ({
    ...state.current,
    player: { ...state.current.player },
  }));
  const [modal, setModal] = useState<Modal>("briefing"),
    [station, setStation] = useState<StationId | null>(null),
    [question, setQuestion] = useState<Question | null>(null),
    [feedback, setFeedback] = useState(""),
    [wrong, setWrong] = useState(false);
  const qa =
      import.meta.env.DEV && new URLSearchParams(location.search).has("qa"),
    qaSpeed = useRef(1);
  const [sound, setSound] = useState(false),
    audio = useRef<AudioContext | null>(null),
    soundRef = useRef(false),
    dialog = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  const sync = () =>
    setView({
      ...state.current,
      player: { ...state.current.player },
      relays: [...state.current.relays],
    });
  const open = (next: Modal) => {
    modalRef.current = next;
    setModal(next);
    keys.current.clear();
    destination.current = null;
  };
  const resume = () => {
    stationRef.current = null;
    setStation(null);
    setFeedback("");
    open(null);
    sync();
  };
  const interact = () => {
    const s = state.current;
    if (modalRef.current || s.status !== "playing") return;
    const near = nearbyStation(s);
    if (!near) {
      s.message = "Move closer to a marked classroom door to interact.";
      sync();
      return;
    }
    if (near.id === "hq") {
      s.player.hp = 100;
      s.checkpoint = { x: 150, y: 500 };
      s.message = "Safe room: health restored. Checkpoint saved.";
      sync();
      return;
    }
    if (near.id === "boss") {
      if (!startBoss(s))
        s.message = s.bossStarted
          ? "The Hall Monitor is already hunting you."
          : !s.surgeDone && s.relays.length === 2
            ? "Survive the hall-change surge before opening the gate."
            : "Restore both classroom relays first.";
      sync();
      return;
    }
    if (s.relays.includes(near.id) || (near.id === "staff" && s.rescued)) {
      s.message =
        "Objective complete. Follow the gold arrow to your next destination.";
      sync();
      return;
    }
    if (near.id === "service" && s.serviceUses >= 2) {
      s.message = "Both reserve power packs have been used.";
      sync();
      return;
    }
    stationRef.current = near.id;
    setStation(near.id);
    setFeedback("");
    setWrong(false);
    setQuestion(
      near.id === "staff"
        ? null
        : QUESTIONS[near.id][near.id === "service" ? s.serviceUses : 0],
    );
    open("station");
  };
  const actions = useRef({ interact, open, sync });
  actions.current = { interact, open, sync };
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);
  useEffect(() => {
    if (!modal && view.status === "playing") return;
    dialog.current?.focus({ preventScroll: true });
  }, [modal, view.status, feedback]);
  useEffect(() => {
    let frame = 0,
      previous = 0,
      accumulator = 0,
      hudTime = 0,
      lastCue = 0,
      lastKills = 0;
    const beep = (frequency: number) => {
      if (!soundRef.current || !audio.current) return;
      const ac = audio.current,
        osc = ac.createOscillator(),
        gain = ac.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        frequency / 2,
        ac.currentTime + 0.07,
      );
      gain.gain.setValueAtTime(0.04, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.1);
    };
    const tick = (time: number) => {
      const delta = previous
        ? Math.min((time - previous) / 1000, 0.25) * qaSpeed.current
        : 0;
      previous = time;
      const s = state.current;
      if (!modalRef.current && s.status === "playing") {
        accumulator += delta;
        while (accumulator >= 1 / 60) {
          const k = keys.current;
          let input = {
            x:
              Number(k.has("d") || k.has("arrowright")) -
              Number(k.has("a") || k.has("arrowleft")),
            y:
              Number(k.has("s") || k.has("arrowdown")) -
              Number(k.has("w") || k.has("arrowup")),
          };
          if (input.x || input.y) destination.current = null;
          if (destination.current) {
            const goal = destination.current,
              p = s.player;
            let point = goal;
            const pc = Math.abs(p.x - 620) < Math.abs(p.x - 1270) ? 620 : 1270,
              gc =
                Math.abs(goal.x - 620) < Math.abs(goal.x - 1270) ? 620 : 1270;
            if (
              Math.abs(p.y - 500) > 12 &&
              (pc !== gc || Math.abs(goal.y - 500) < 70)
            )
              point = { x: pc, y: 500 };
            else if (Math.abs(p.x - gc) > 12 && Math.abs(goal.y - 500) >= 70)
              point = { x: gc, y: 500 };
            const d = distance(p, point);
            input =
              d < 4
                ? { x: 0, y: 0 }
                : { x: (point.x - p.x) / d, y: (point.y - p.y) / d };
            if (distance(p, goal) < 6) destination.current = null;
          }
          stepCombat(s, input, 1 / 60);
          accumulator -= 1 / 60;
          if (s.status !== "playing") break;
          if (s.xp >= s.upgradeAt) {
            actions.current.open("upgrade");
            accumulator = 0;
            break;
          }
        }
        if (s.xp >= s.upgradeAt && s.status === "playing")
          actions.current.open("upgrade");
      } else accumulator = 0;
      if (s.soundCue !== lastCue) {
        beep(440);
        lastCue = s.soundCue;
      }
      if (s.kills !== lastKills) {
        beep(160);
        lastKills = s.kills;
      }
      if (canvas.current) draw(canvas.current, s, avatar, destination.current);
      hudTime += delta;
      if (hudTime > 0.1) {
        actions.current.sync();
        hudTime = 0;
      }
      frame = requestAnimationFrame(tick);
    };
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (
        ![
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
          "e",
          "p",
          "escape",
        ].includes(key)
      )
        return;
      if ((event.target as HTMLElement).closest("input,select,textarea"))
        return;
      if (modalRef.current) {
        if ((key === "escape" || key === "p") && modalRef.current === "pause")
          actions.current.open(null);
        return;
      }
      if ((event.target as HTMLElement).closest("button") && key === " ")
        return;
      event.preventDefault();
      keys.current.add(key);
      if (event.repeat) return;
      if (key === "e") actions.current.interact();
      if (key === " ") {
        activateAbility(state.current);
        actions.current.sync();
      }
      if (key === "p" || key === "escape") actions.current.open("pause");
    };
    const up = (event: KeyboardEvent) =>
      keys.current.delete(event.key.toLowerCase());
    const blur = () => {
      keys.current.clear();
      destination.current = null;
      if (!modalRef.current && state.current.status === "playing")
        actions.current.open("pause");
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      keys.current.clear();
    };
  }, [avatar]);
  function answer(index: number) {
    const s = state.current;
    if (feedback || !station) return;
    if (station === "staff") {
      s.rescued = true;
      if (index === 0) {
        s.honor += 15;
        s.xp += 15;
        s.player.energy = Math.min(100, s.player.energy + 10);
        s.player.hp = Math.min(100, s.player.hp + 20);
        setFeedback(
          "You organize a safe escort. +15 honor, +15 XP, +10 energy, +20 health. A rescued survivor shares first-aid supplies.",
        );
      } else {
        s.honor += 5;
        s.xp += 5;
        setFeedback(
          "You report the location and continue the relay work. +5 honor, +5 XP.",
        );
      }
    } else if (question) {
      if (index !== question.correct) {
        setWrong(true);
        setFeedback(
          question.explanation +
            " Reconsider the decision and retry. No energy is lost.",
        );
        sync();
        return;
      }
      if (station === "service") {
        s.serviceUses++;
        s.player.energy = Math.min(100, s.player.energy + 30);
        s.player.hp = Math.min(100, s.player.hp + 20);
        s.xp += 10;
        s.message = "Power pack acquired. +30 energy, +20 health.";
      } else if (station === "marketing" || station === "tech")
        restoreRelay(s, station);
      setFeedback(
        question.explanation +
          (station === "service"
            ? " +30 energy, +20 health, +10 XP."
            : " +25 energy, +15 health, +20 XP. Checkpoint saved."),
      );
    }
    sync();
  }
  const near = nearbyStation(view),
    goal = objective(view),
    boss = view.enemies.find((e) => e.boss),
    abilityReady =
      !modal &&
      view.status === "playing" &&
      view.player.energy >= 25 &&
      view.player.abilityIn <= 0;
  const toggleSound = () => {
    if (!sound) {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        return;
      }
    }
    setSound(!sound);
  };
  const trap = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const buttons = dialog.current?.querySelectorAll<HTMLElement>(
      "button:not(:disabled),a[href]",
    );
    if (!buttons?.length) return;
    const first = buttons[0],
      last = buttons[buttons.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === dialog.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        document.activeElement === dialog.current)
    ) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <section className="combat-prototype" aria-label="Corpocalypse Mission 1">
      <header className="combat-top">
        <a
          className="mission-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (!modalRef.current && state.current.status === "playing")
              open("pause");
          }}
        >
          <b>W</b>
          <div>
            <span>CORPOCALYPSE / WOODSIDE</span>
            <h1>
              THE FIRST BELL<span>MISSION 01</span>
            </h1>
          </div>
        </a>
        <div className="top-actions">
          {qa && (
            <>
              <label>
                QA speed{" "}
                <select
                  aria-label="QA simulation speed"
                  onChange={(e) => (qaSpeed.current = Number(e.target.value))}
                >
                  <option value="1">1×</option>
                  <option value="8">8×</option>
                  <option value="32">32×</option>
                </select>
              </label>
              <span data-testid="qa-position">
                {Math.round(view.player.x)},{Math.round(view.player.y)}
              </span>
            </>
          )}
          <span className="mission-clock">
            {String(Math.floor(view.elapsed / 60)).padStart(2, "0")}:
            {String(Math.floor(view.elapsed % 60)).padStart(2, "0")}
          </span>
          <button onClick={toggleSound} aria-pressed={sound}>
            Sound {sound ? "on" : "off"}
          </button>
          <button
            onClick={() => open("pause")}
            disabled={!!modal || view.status !== "playing"}
          >
            Ⅱ Pause
          </button>
        </div>
      </header>
      <div className="mission-objective">
        <span className="objective-number">
          {view.relays.length < 2 ? `0${view.relays.length + 1}` : "03"}
        </span>
        <div>
          <small>CURRENT OBJECTIVE</small>
          <strong>{goal.title}</strong>
          <span>{goal.detail}</span>
        </div>
        <div className="relay-count">
          <b>{view.relays.length}/2</b>
          <small>RELAYS ONLINE</small>
        </div>
      </div>
      <div
        className="mobile-resource-strip"
        aria-label="Live survivor resources"
      >
        <span>
          HEALTH <b>{Math.ceil(view.player.hp)}/100</b>
        </span>
        <span>
          ENERGY <b>{view.player.energy}/100</b>
        </span>
        <span>
          LV <b>{view.level}</b>
        </span>
      </div>
      <div className="combat-layout">
        <div className="combat-stage">
          <canvas
            ref={canvas}
            tabIndex={0}
            aria-label="School hallway. Move with WASD or arrows, or click a floor tile to walk. E to interact. Space for ability."
            onPointerDown={(e) => {
              if (
                modalRef.current ||
                state.current.status !== "playing" ||
                !canvas.current
              )
                return;
              const point = screenPoint(
                canvas.current,
                state.current,
                e.clientX,
                e.clientY,
              );
              if (walkable(point)) {
                destination.current = point;
                canvas.current.focus();
              }
            }}
          />
          <div className="combat-location">
            <i /> A HOUSE <span>CONNECTED HALLS</span>
          </div>
          {boss && (
            <div className="boss-health">
              <span>
                THE HALL MONITOR{" "}
                <b>
                  {Math.ceil(boss.hp)}/{boss.maxHp}
                </b>
              </span>
              <progress max={boss.maxHp} value={boss.hp} />
            </div>
          )}
          {view.surgeLeft > 0 && (
            <div className="surge-banner">
              HALL-CHANGE SURGE <b>{Math.ceil(view.surgeLeft)}s</b>
            </div>
          )}
          <div className="combat-hint">
            {near ? (
              <>
                <kbd>E</kbd> {near.label} <span>{near.detail}</span>
              </>
            ) : (
              <>
                <span className="auto-dot" /> AUTO-ATTACK ACTIVE{" "}
                <span>Keep moving · Collect glowing XP</span>
              </>
            )}
          </div>
          {(modal || view.status !== "playing") && (
            <div className="combat-overlay">
              <div
                className="combat-dialog"
                ref={dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                tabIndex={-1}
                onKeyDown={trap}
              >
                {view.status === "dead" ? (
                  <>
                    <span>CHECKPOINT RECOVERY</span>
                    <h2 id="dialog-title">The bell isn't over.</h2>
                    <p>
                      Your relay progress, XP and honor are safe. Temporary
                      upgrades are lost. Recover at your last classroom
                      checkpoint with full health.
                    </p>
                    <button
                      className="gold-button"
                      onClick={() => {
                        respawn(state.current);
                        resume();
                      }}
                    >
                      Return to checkpoint →
                    </button>
                    <button onClick={onExit}>Mission menu</button>
                  </>
                ) : view.status === "won" ? (
                  <>
                    <span>MISSION 01 / COMPLETE</span>
                    <h2 id="dialog-title">A HOUSE. STILL STANDING.</h2>
                    <p>
                      The relays are online. The Hall Monitor is down. The
                      evacuation route is open.
                    </p>
                    <div className="result-grid">
                      <b>
                        {view.kills}
                        <small>ZOMBIES CLEARED</small>
                      </b>
                      <b>
                        {view.xp}
                        <small>XP EARNED</small>
                      </b>
                      <b>
                        {view.honor}
                        <small>HONOR</small>
                      </b>
                      <b>
                        {view.recoveries}
                        <small>RECOVERIES</small>
                      </b>
                    </div>
                    <p>
                      {view.rescued
                        ? "You also made time to help a stranded survivor."
                        : "A staff-room survivor was left for a later rescue team."}
                    </p>
                    <button
                      className="gold-button"
                      onClick={() => {
                        state.current = createCombat(role);
                        open("briefing");
                        sync();
                      }}
                    >
                      Play another run →
                    </button>
                    <button onClick={onExit}>Change survivor</button>
                  </>
                ) : modal === "briefing" ? (
                  <>
                    <span>7:10 AM / A HOUSE / FONTAINE ON THE RADIO</span>
                    <h2 id="dialog-title">
                      First period.
                      <br />
                      Last normal day.
                    </h2>
                    <p>
                      Something is wrong in the halls. The evacuation signal is
                      down, and the gym gate is locked. Restore two classroom
                      relays. Survive the bell. Clear the route.
                    </p>
                    <div className="briefing-steps">
                      <div>
                        <b>01</b>
                        <span>
                          MARKETING LAB<small>Restore the broadcast</small>
                        </span>
                      </div>
                      <div>
                        <b>02</b>
                        <span>
                          TECHNOLOGY LAB<small>Bring the network online</small>
                        </span>
                      </div>
                      <div>
                        <b>03</b>
                        <span>
                          GYM GATE<small>Face the Hall Monitor</small>
                        </span>
                      </div>
                    </div>
                    <p className="control-summary">
                      <kbd>WASD</kbd> / arrows to move · click the floor to walk
                      <br />
                      <kbd>E</kbd> interact · <kbd>Space</kbd>{" "}
                      {ROLES[role].ability}
                      <br />
                      Attacks fire automatically. Collect green XP. Classroom
                      time is paused.
                    </p>
                    <button className="gold-button" onClick={resume}>
                      Head into the halls →
                    </button>
                  </>
                ) : modal === "station" ? (
                  <>
                    <span>CLASSROOM ENCOUNTER / HALLWAY TIME PAUSED</span>
                    <h2 id="dialog-title">
                      {STATIONS.find((s) => s.id === station)?.label}
                    </h2>
                    <p>
                      {station === "staff"
                        ? "A staff member has found a stranded survivor. An escort will slow your relay work, but the survivor has first-aid supplies. What is your move?"
                        : question?.prompt}
                    </p>
                    {!feedback && (
                      <div className="combat-choices">
                        {(station === "staff"
                          ? [
                              "Organize a safe escort, then resume the relay mission.",
                              "Report the location and prioritize the relays.",
                            ]
                          : question?.options || []
                        ).map((option, i) => (
                          <button key={option} onClick={() => answer(i)}>
                            <b>{String.fromCharCode(65 + i)}</b>
                            <span>{option}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {feedback && (
                      <p
                        className={
                          wrong ? "combat-feedback wrong" : "combat-feedback"
                        }
                        role="status"
                      >
                        {feedback}
                      </p>
                    )}
                    {wrong && (
                      <button
                        className="gold-button"
                        onClick={() => {
                          setFeedback("");
                          setWrong(false);
                        }}
                      >
                        Review choices
                      </button>
                    )}
                    <button
                      className={feedback && !wrong ? "gold-button" : ""}
                      onClick={resume}
                    >
                      {feedback && !wrong
                        ? "Back to the halls →"
                        : "Leave classroom"}
                    </button>
                  </>
                ) : modal === "upgrade" ? (
                  <>
                    <span>LEVEL {view.level + 1} / FIELD UPGRADE</span>
                    <h2 id="dialog-title">Make your next move.</h2>
                    <p>
                      Pick one upgrade for this run. Classroom progress survives
                      a checkpoint recovery; these upgrades don't.
                    </p>
                    <div className="upgrade-grid">
                      {UPGRADES.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            chooseUpgrade(state.current, item.id);
                            resume();
                          }}
                        >
                          <b>{item.icon}</b>
                          <strong>{item.name}</strong>
                          <span>{item.detail}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <span>TAKE A BREATHER</span>
                    <h2 id="dialog-title">Mission paused.</h2>
                    <p>
                      Follow the gold arrow and minimap to your objective.
                      Attacks fire automatically. Green pickups give XP and a
                      little energy. Supply desk visits restore energy and
                      health.
                    </p>
                    <p>
                      <kbd>WASD</kbd> move · <kbd>E</kbd> interact ·{" "}
                      <kbd>Space</kbd> ability
                    </p>
                    <button className="gold-button" onClick={resume}>
                      Resume mission →
                    </button>
                    <button onClick={onExit}>Mission menu</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <aside className="combat-sidebar" aria-label="Survivor status">
          <div className="survivor-card">
            <span className="survivor-avatar">{avatar}</span>
            <div>
              <small>YOUR SURVIVOR</small>
              <h2>{name || "Rookie"}</h2>
              <p>{ROLES[role].name}</p>
            </div>
            <b>LV {view.level}</b>
          </div>
          <div className="resource-bars">
            <label>
              HEALTH{" "}
              <b>
                {Math.ceil(view.player.hp)}
                <span>/100</span>
              </b>
              <progress max={100} value={view.player.hp} />
            </label>
            <label className="energy-bar">
              ENERGY{" "}
              <b>
                {view.player.energy}
                <span>/100</span>
              </b>
              <progress max={100} value={view.player.energy} />
            </label>
            <label className="xp-bar">
              NEXT UPGRADE{" "}
              <b>
                {Math.min(view.xp, view.upgradeAt)}
                <span>/{view.upgradeAt} XP</span>
              </b>
              <progress
                max={35}
                value={Math.max(0, view.xp - (view.upgradeAt - 35))}
              />
            </label>
          </div>
          <div className="combat-stats">
            <b>
              {view.kills}
              <small>CLEARED</small>
            </b>
            <b>
              {view.honor}
              <small>HONOR</small>
            </b>
            <b>
              {view.xp}
              <small>TOTAL XP</small>
            </b>
          </div>
          <article className="mission-checklist">
            <span>THE EVACUATION PLAN</span>
            <p className={view.relays.includes("marketing") ? "done" : ""}>
              <b>{view.relays.includes("marketing") ? "✓" : "01"}</b>Broadcast
              relay
            </p>
            <p className={view.relays.includes("tech") ? "done" : ""}>
              <b>{view.relays.includes("tech") ? "✓" : "02"}</b>Network relay
            </p>
            <p className={view.surgeDone ? "done" : ""}>
              <b>{view.surgeDone ? "✓" : "03"}</b>Survive hall change
            </p>
            <p className={view.status === "won" ? "done" : ""}>
              <b>{view.status === "won" ? "✓" : "04"}</b>Hall Monitor
            </p>
          </article>
          <div className="radio-message">
            <span>▥ FONTAINE / RADIO</span>
            <p aria-live="polite">{view.message}</p>
          </div>
          <button
            className="ability-button"
            disabled={!abilityReady}
            onClick={() => {
              activateAbility(state.current);
              sync();
            }}
          >
            <small>SPACE / CLASS ABILITY</small>
            <b>{ROLES[role].ability}</b>
            <span>
              {view.player.abilityIn > 0
                ? `${Math.ceil(view.player.abilityIn)}s cooldown`
                : view.player.energy < 25
                  ? "Need 25 energy"
                  : "25 energy · Ready"}
            </span>
          </button>
          <p className="combat-help">{ROLES[role].description}</p>
          <div className="field-kit">
            <span>FIELD KIT</span>
            <p>
              +{view.damageBoost} damage · +{view.speedBoost} speed
            </p>
            <p>
              {view.fireBoost > 0
                ? `${Math.round(view.fireBoost * 1000)}ms faster fire`
                : "Standard textbook toss"}{" "}
              · {115 + view.magnetBoost} pickup range
            </p>
          </div>
        </aside>
      </div>
      <nav className="combat-touch" aria-label="Touch controls">
        <div className="direction-pad">
          {[
            ["↑", "arrowup"],
            ["←", "arrowleft"],
            ["↓", "arrowdown"],
            ["→", "arrowright"],
          ].map(([label, key]) => (
            <button
              key={key}
              disabled={!!modal || view.status !== "playing"}
              aria-label={`Move ${key.replace("arrow", "")}`}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                keys.current.add(key);
                destination.current = null;
              }}
              onPointerUp={() => keys.current.delete(key)}
              onPointerCancel={() => keys.current.delete(key)}
              onLostPointerCapture={() => keys.current.delete(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          disabled={!!modal || view.status !== "playing"}
          onClick={interact}
        >
          Interact <kbd>E</kbd>
        </button>
        <button
          className="touch-ability"
          disabled={!abilityReady}
          onClick={() => {
            activateAbility(state.current);
            sync();
          }}
        >
          {ROLES[role].ability}
          <small>
            {view.player.abilityIn > 0
              ? `${Math.ceil(view.player.abilityIn)}s`
              : "25 energy"}
          </small>
        </button>
        <span>MOVE · EXPLORE · SURVIVE</span>
      </nav>
    </section>
  );
}
