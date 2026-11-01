import { useEffect, useState } from "react";
import CombatPrototype from "./combat/CombatPrototype";
import LegacyApp from "./LegacyApp";
import { ROLES, type RoleId } from "./combat/engine";
import "./combat/combat.css";
const avatars = ["🧑🏾‍🎓", "👩🏽‍🎓", "🧑🏻‍🎓", "👩🏾‍💻", "🧑🏽‍💼", "👩🏻‍🎨"];
const icons: Record<RoleId, string> = {
  marketing: "◉",
  tech: "ϟ",
  sports: "»",
  entrepreneur: "✦",
  fashion: "◇",
  operations: "▣",
};
export default function App() {
  const [mode, setMode] = useState<"menu" | "mission" | "legacy">("menu"),
    [role, setRole] = useState<RoleId>("marketing"),
    [avatar, setAvatar] = useState(avatars[0]),
    [name, setName] = useState("");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);
  if (mode === "mission")
    return (
      <CombatPrototype
        role={role}
        avatar={avatar}
        name={name.trim() || "Rookie"}
        onExit={() => setMode("menu")}
      />
    );
  if (mode === "legacy")
    return (
      <>
        <button className="legacy-back" onClick={() => setMode("menu")}>
          ← Mission 1 menu
        </button>
        <LegacyApp />
      </>
    );
  return (
    <main className="mission-menu">
      <header className="menu-nav">
        <b className="menu-w">W</b>
        <span>
          WOODSIDE HIGH SCHOOL <small>A CORPOCALYPSE STORY</small>
        </span>
        <span className="build-tag">MISSION 01 / PLAYTEST</span>
      </header>
      <div className="menu-grid">
        <section className="menu-story">
          <p className="kicker">
            <i /> THE OUTBREAK STARTS AT 7:10.
          </p>
          <h1>
            THE DAY
            <br />
            WOODSIDE
            <br />
            <em>FELL.</em>
          </h1>
          <p className="menu-lede">
            The halls are overrun. The signal is down.
            <br />
            You still have a school to save.
          </p>
          <div className="story-divider" />
          <p className="chapter-label">CHAPTER 01 — THE FIRST BELL</p>
          <p className="story-detail">
            Fight through A House. Restore the classroom relays. Face the Hall
            Monitor. Your skills are your survival kit.
          </p>
          <div className="mission-tags">
            <span>AUTO-ATTACK COMBAT</span>
            <span>CLASSROOM CHOICES</span>
            <span>CHECKPOINT RECOVERY</span>
          </div>
          <div className="menu-map" aria-hidden="true">
            <div className="map-hall" />
            <div className="map-cross one" />
            <div className="map-cross two" />
            <b className="map-start">W</b>
            <span className="map-label first">01 / BROADCAST</span>
            <span className="map-label second">02 / NETWORK</span>
            <span className="map-label final">03 / GYM GATE</span>
            <span className="map-zombie z1">×</span>
            <span className="map-zombie z2">×</span>
            <span className="map-zombie z3">×</span>
            <span className="map-caption">
              A HOUSE / FIRST RESPONSE / SCHEMATIC
            </span>
          </div>
        </section>
        <section className="loadout-panel">
          <div className="loadout-heading">
            <span>PREPARE FOR FIRST PERIOD</span>
            <h2>Choose your survivor.</h2>
            <p>Every role fights. Your ability changes how you survive.</p>
          </div>
          <label className="tag-label" htmlFor="gamer-tag">
            GAMER TAG <span>OPTIONAL</span>
          </label>
          <input
            id="gamer-tag"
            maxLength={18}
            placeholder="Rookie"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="avatar-select" aria-label="Choose avatar">
            {avatars.map((item, i) => (
              <button
                key={item}
                aria-label={`Avatar ${i + 1}`}
                aria-pressed={avatar === item}
                onClick={() => setAvatar(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="tag-label">STARTING ROLE</p>
          <div className="loadout-roles">
            {(Object.keys(ROLES) as RoleId[]).map((id) => (
              <button
                key={id}
                aria-pressed={role === id}
                onClick={() => setRole(id)}
              >
                <b style={{ color: ROLES[id].color }}>{icons[id]}</b>
                <span>
                  {ROLES[id].name}
                  <small>{ROLES[id].ability}</small>
                </span>
                {role === id && <i>✓</i>}
              </button>
            ))}
          </div>
          <div className="loadout-ability">
            <b>{ROLES[role].ability}</b>
            <p>{ROLES[role].description}</p>
            <span>25 ENERGY · 8 SECOND COOLDOWN</span>
          </div>
          <button className="deploy-button" onClick={() => setMode("mission")}>
            START MISSION 1 <span>→</span>
          </button>
          <p className="menu-controls">
            WASD / arrows or tap to move · Auto-attacks
            <br />E to interact · Space for your ability · Touch controls
            included
          </p>
        </section>
      </div>
      <footer className="menu-footer">
        <span>CORPOCALYPSE 2.0 / THE DAY WOODSIDE FELL</span>
        <button onClick={() => setMode("legacy")}>
          Earlier Woodside story prototype ↗
        </button>
        <a
          href="https://raw.githack.com/robertfontaine-ship-it/CODEX-GAMES/23068513747af8292ddffc9d0f2e2f7aaab10507/preview/index.html"
          target="_blank"
          rel="noreferrer"
        >
          Original corporate campaign ↗
        </a>
      </footer>
    </main>
  );
}
