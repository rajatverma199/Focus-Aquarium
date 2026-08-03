import "./styles.css";

const DURATIONS = [10, 15, 25];
const DEFAULT_DURATION = 25;
const STORAGE_KEY = "focus-aquarium-state-v1";
const MINI_VIEW_PARAM = "mini";

const REWARD_POOLS = {
  10: {
    tier: "Common",
    label: "Common finds",
    description: "Friendly little tank dwellers",
    items: [
      {
        key: "goldfish",
        name: "Sunny Goldfish",
        shortName: "Goldfish",
        description: "A bright, sociable regular who is happiest near the surface."
      },
      {
        key: "koi",
        name: "Miniature Koi",
        shortName: "Koi",
        description: "A pocket-sized koi with cloud-white scales and coral markings."
      },
      {
        key: "hermit",
        name: "Striped Hermit Crab",
        shortName: "Hermit Crab",
        description: "A tiny scavenger who is always on the lookout for a better shell."
      }
    ]
  },
  15: {
    tier: "Unique",
    label: "Unique finds",
    description: "Oddities from the seafloor",
    items: [
      {
        key: "helmet",
        name: "Brass Diver Helmet",
        shortName: "Dive Helmet",
        description: "An old deep-sea helmet, polished by years of moving water."
      },
      {
        key: "boot",
        name: "Lost Dive Boot",
        shortName: "Dive Boot",
        description: "Heavy, weathered, and missing its other half somewhere in the deep."
      },
      {
        key: "wheel",
        name: "Sunken Hamster Wheel",
        shortName: "Hamster Wheel",
        description: "No one knows how it got here. The shrimp seem delighted by it."
      }
    ]
  },
  25: {
    tier: "Rare",
    label: "Rare finds",
    description: "Remarkable life from deeper water",
    items: [
      {
        key: "moonfin",
        name: "Moonfin Angelfish",
        shortName: "Moonfin",
        description: "A luminous visitor whose fins catch the light like moonlit glass."
      },
      {
        key: "parrotfish",
        name: "Reef Parrotfish",
        shortName: "Parrotfish",
        description: "A vivid reef gardener dressed in turquoise and coral."
      },
      {
        key: "blue-tang",
        name: "Regal Blue Tang",
        shortName: "Blue Tang",
        description: "An electric-blue traveler with a bright flash of yellow at its tail."
      },
      {
        key: "seahorse",
        name: "Glass Seahorse",
        shortName: "Seahorse",
        description: "Delicate, unhurried, and almost transparent beneath the tank lights."
      },
      {
        key: "lobster",
        name: "Ruby Reef Lobster",
        shortName: "Lobster",
        description: "A jewel-red night wanderer with an impressive pair of claws."
      },
      {
        key: "turtle",
        name: "Emerald Sea Turtle",
        shortName: "Sea Turtle",
        description: "A serene ocean traveler with a shell patterned like polished jade."
      },
      {
        key: "antlerfish",
        name: "Crowned Antlerfish",
        shortName: "Antlerfish",
        description: "A mysterious blue fish crowned with delicate branching antlers."
      }
    ]
  }
};

const ALL_REWARDS = Object.entries(REWARD_POOLS).flatMap(([duration, pool]) =>
  pool.items.map((item) => ({
    ...item,
    durationMinutes: Number(duration),
    rarity: pool.tier
  }))
);

const FOCUS_NOTES = [
  ["Let the surface settle", "The first few minutes are for quieting mental ripples. Keep one task in view and let everything else drift past."],
  ["Stay below the noise", "Every avoided switch preserves the context already in your head. That continuity is where deeper work begins."],
  ["One current at a time", "If another task appears, note it for later instead of changing direction. Your only job is this dive."],
  ["The rare finds are deeper", "Longer, uninterrupted sessions create room for ideas that never reach the surface during fragmented work."],
  ["Finish the dive clean", "Completing the full interval teaches your attention that a focus promise is worth keeping."]
];

const initialState = {
  selectedTask: "",
  selectedDurationMinutes: DEFAULT_DURATION,
  collection: [],
  activeSession: null
};

const app = document.querySelector("#app");
let state = loadState();
let tickHandle = null;

render();
startTickerIfNeeded();

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  state = loadState();
  render();
  startTickerIfNeeded();
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return { ...initialState };
    return {
      selectedTask: typeof saved.selectedTask === "string" ? saved.selectedTask : "",
      selectedDurationMinutes: DURATIONS.includes(saved.selectedDurationMinutes)
        ? saved.selectedDurationMinutes
        : DEFAULT_DURATION,
      collection: Array.isArray(saved.collection) ? saved.collection : [],
      activeSession: saved.activeSession || null
    };
  } catch {
    return { ...initialState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(updater) {
  state = typeof updater === "function" ? updater(state) : updater;
  saveState();
  render();
  startTickerIfNeeded();
}

function startFocusSession() {
  const task = state.selectedTask.trim();
  if (state.activeSession) return;

  const now = Date.now();
  const durationMinutes = state.selectedDurationMinutes;
  const reward = chooseReward(durationMinutes);
  setState((current) => ({
    ...current,
    activeSession: {
      id: crypto.randomUUID(),
      task,
      durationMinutes,
      rewardKey: reward.key,
      startedAt: now,
      endsAt: now + durationMinutes * 60 * 1000
    }
  }));
}

function finishFocusSession() {
  if (!state.activeSession) return;
  const session = state.activeSession;
  const reward = session.rewardKey
    ? getRewardByKey(session.rewardKey)
    : chooseReward(session.durationMinutes);

  setState((current) => ({
    ...current,
    selectedTask: "",
    activeSession: null,
    collection: [
      ...current.collection,
      {
        id: session.id,
        rewardKey: reward.key,
        task: session.task,
        durationMinutes: session.durationMinutes,
        completedAt: session.endsAt
      }
    ]
  }));
}

function cancelFocusSession() {
  if (!state.activeSession) return;
  setState((current) => ({ ...current, activeSession: null }));
}

function maybeCompleteExpiredSession() {
  if (state.activeSession && Date.now() >= state.activeSession.endsAt) {
    finishFocusSession();
  }
}

function startTickerIfNeeded() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
  if (!state.activeSession) return;

  tickHandle = window.setInterval(() => {
    maybeCompleteExpiredSession();
    if (state.activeSession) updateLiveSessionUI();
  }, 1000);
}

function updateLiveSessionUI() {
  const remainingTime = getRemainingTime();
  const progress = getProgress();
  const focusNote = getFocusNote();

  document.title = `${formatTime(remainingTime)} · Focus Aquarium`;

  app.querySelectorAll("[data-live-time]").forEach((element) => {
    element.textContent = formatTime(remainingTime);
  });

  app.querySelectorAll("[data-live-progress]").forEach((element) => {
    element.style.width = `${progress * 100}%`;
  });

  const progressCopy = app.querySelector("[data-live-progress-copy]");
  if (progressCopy) progressCopy.textContent = `${Math.round(progress * 100)}% of the dive complete`;

  const activeFind = app.querySelector("[data-active-find]");
  if (activeFind) activeFind.style.setProperty("--reveal", Math.max(progress, 0.16));

  const noteLabel = app.querySelector("[data-focus-note-label]");
  const noteTitle = app.querySelector("[data-focus-note-title]");
  const noteBody = app.querySelector("[data-focus-note-body]");
  if (noteLabel) noteLabel.textContent = `Field note · minute ${Math.floor((Date.now() - state.activeSession.startedAt) / 60000) + 1}`;
  if (noteTitle) noteTitle.textContent = `“${focusNote.title}.”`;
  if (noteBody) noteBody.textContent = focusNote.body;
}

function getDuration() {
  return state.activeSession?.durationMinutes || state.selectedDurationMinutes;
}

function getRemainingTime() {
  if (!state.activeSession) return state.selectedDurationMinutes * 60 * 1000;
  return Math.max(state.activeSession.endsAt - Date.now(), 0);
}

function getProgress() {
  if (!state.activeSession) return 0;
  const total = state.activeSession.durationMinutes * 60 * 1000;
  return Math.min(Math.max((Date.now() - state.activeSession.startedAt) / total, 0), 1);
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRewardByKey(key) {
  return ALL_REWARDS.find((reward) => reward.key === key) || ALL_REWARDS[0];
}

function getRewardPool(duration) {
  return REWARD_POOLS[duration] || REWARD_POOLS[DEFAULT_DURATION];
}

function chooseReward(duration) {
  const items = getRewardPool(duration).items;
  return items[Math.floor(Math.random() * items.length)];
}

function getActiveReward() {
  if (!state.activeSession) return null;
  return getRewardByKey(state.activeSession.rewardKey || getRewardPool(state.activeSession.durationMinutes).items[0].key);
}

function getFocusNote() {
  const elapsed = state.activeSession ? Date.now() - state.activeSession.startedAt : 0;
  const index = Math.min(Math.floor(elapsed / (5 * 60 * 1000)), FOCUS_NOTES.length - 1);
  return { title: FOCUS_NOTES[index][0], body: FOCUS_NOTES[index][1], index };
}

function getCollectionCount(rewardKey) {
  return state.collection.filter((item) => item.rewardKey === rewardKey).length;
}

function render() {
  maybeCompleteExpiredSession();
  const remainingTime = getRemainingTime();
  document.body.dataset.view = isMiniView() ? "mini" : "full";
  document.title = state.activeSession
    ? `${formatTime(remainingTime)} · Focus Aquarium`
    : "Focus Aquarium";

  app.innerHTML = isMiniView() ? renderMiniTimer() : renderApp();
  bindEvents();
}

function renderApp() {
  const duration = getDuration();
  const rewardPool = getRewardPool(duration);
  const activeReward = getActiveReward();
  const remainingTime = getRemainingTime();
  const progress = getProgress();
  const task = state.activeSession?.task || state.selectedTask;
  const totalMinutes = state.collection.reduce((sum, item) => sum + (item.durationMinutes || 0), 0);
  const rareKeys = new Set(REWARD_POOLS[25].items.map((item) => item.key));
  const rareCount = state.collection.filter((item) => rareKeys.has(item.rewardKey)).length;

  return `
    <main class="site-shell">
      <nav class="topbar ${state.activeSession ? "session-active" : ""}" aria-label="Main navigation">
        <a class="brand" href="#top" aria-label="Focus Aquarium home">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>Focus Aquarium</span>
        </a>
        ${state.activeSession ? `
          <div class="topbar-timer" role="timer" aria-label="Time remaining in focus dive">
            <span>Time remaining</span>
            <strong data-live-time>${formatTime(remainingTime)}</strong>
          </div>
        ` : ""}
        <div class="nav-actions">
          <a href="#collection">My collection</a>
          ${renderPopoutButton()}
        </div>
      </nav>

      <section class="hero" id="top">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> Your quiet corner of the deep</p>
          <h1>Stay with one thing.<br><em>See what follows.</em></h1>
          <p class="hero-intro">Choose a focus dive length, put tasks in the tank, and earn new aquatic treasures every time the timer completes.</p>

          <section class="focus-card" aria-labelledby="focus-card-title">
            <div class="focus-card-heading">
              <div>
                <p class="micro-label">Next dive</p>
                <h2 id="focus-card-title">What are you focusing on?</h2>
              </div>
              <span class="session-state ${state.activeSession ? "live" : ""}">${state.activeSession ? "Dive in progress" : "Ready to dive"}</span>
            </div>

            <label class="task-field">
              <span class="sr-only">Focus task</span>
              <input data-task-input maxlength="80" value="${escapeHTML(task)}" placeholder="The task you want to complete (optional)" ${state.activeSession ? "disabled" : ""}>
            </label>

            <div class="duration-section">
              <p class="micro-label">Choose your depth · each length unlocks a different kind of find</p>
              <div class="duration-grid" role="group" aria-label="Choose focus duration">
                ${DURATIONS.map(renderDurationOption).join("")}
              </div>
            </div>

            <div class="focus-action-row">
              <button class="primary-action" data-action="start" ${state.activeSession ? "disabled" : ""}>
                ${state.activeSession ? "Dive in progress" : `Begin ${duration}-minute dive`} <span aria-hidden="true">→</span>
              </button>
              ${state.activeSession ? '<button class="stop-action" data-action="cancel">End dive</button>' : ""}
              <p data-action-note>${state.activeSession ? task ? `Stay with “${escapeHTML(task)}” while a ${activeReward.rarity.toLowerCase()} find takes shape.` : `Stay with the timer while a ${activeReward.rarity.toLowerCase()} find takes shape.` : `Complete this dive to discover one of ${rewardPool.items.length} ${rewardPool.label.toLowerCase()}.`}</p>
            </div>
          </section>
        </div>

        <div class="aquarium-column">
          <div class="aquarium-frame ${state.activeSession ? "session-live" : ""}" aria-label="An animated aquarium with swimming fish and bubbles">
            <div class="tank-topbar">
              <div>
                <p>${state.activeSession ? "Current dive" : "Aquarium live view"}</p>
                <strong>${state.activeSession ? escapeHTML(task) : "The water is calm"}</strong>
              </div>
              <span class="live-dot"><i></i> Live</span>
            </div>
            ${renderAquarium(activeReward, progress)}
            <div class="timer-dock">
              <div>
                <span>${state.activeSession ? "Time below" : `${rewardPool.label} dive`}</span>
                <strong data-live-time>${formatTime(remainingTime)}</strong>
              </div>
              <div class="progress-wrap">
                <span data-live-progress style="width:${progress * 100}%"></span>
              </div>
              <small ${state.activeSession ? "data-live-progress-copy" : ""}>${state.activeSession ? `${Math.round(progress * 100)}% of the dive complete` : `${rewardPool.items.length} possible ${rewardPool.tier.toLowerCase()} finds`}</small>
            </div>
          </div>
        </div>
      </section>

      <section class="collection-section" id="collection">
        <div class="section-heading">
          <div>
            <p class="eyebrow dark"><span></span> Your discoveries</p>
            <h2>A collection built<br>one quiet dive at a time.</h2>
          </div>
          <div class="collection-stats">
            <div><strong>${state.collection.length}</strong><span>Total finds</span></div>
            <div><strong>${totalMinutes}</strong><span>Focus minutes</span></div>
            <div><strong>${rareCount}</strong><span>Rare fish</span></div>
          </div>
        </div>

        <div class="collection-categories">
          ${DURATIONS.map(renderCollectionCategory).join("")}
        </div>

        ${renderRecentFinds()}
      </section>

      <section class="focus-note">
        <p class="micro-label" ${state.activeSession ? "data-focus-note-label" : ""}>Field note · ${state.activeSession ? `minute ${Math.floor((Date.now() - state.activeSession.startedAt) / 60000) + 1}` : "before you begin"}</p>
        <blockquote ${state.activeSession ? "data-focus-note-title" : ""}>“${getFocusNote().title}.”</blockquote>
        <p ${state.activeSession ? "data-focus-note-body" : ""}>${getFocusNote().body}</p>
      </section>

      <footer><span>Focus Aquarium</span><p>Small dives. A living collection.</p></footer>
    </main>
  `;
}

function renderDurationOption(minutes) {
  const pool = getRewardPool(minutes);
  const selected = getDuration() === minutes;
  return `
    <button class="duration-option ${selected ? "selected" : ""}" data-duration-minutes="${minutes}" ${state.activeSession ? "disabled" : ""} aria-pressed="${selected}">
      <span class="duration-time">${minutes}<small>min</small></span>
      <span class="duration-copy"><strong>${pool.label}</strong><small>${pool.description}</small></span>
      <span class="duration-rewards" aria-label="Possible ${pool.label.toLowerCase()}">
        ${pool.items.map((item) => `<span class="duration-reward ${item.key}" title="${item.name}">${renderCreature(item.key)}</span>`).join("")}
      </span>
      <i aria-hidden="true"></i>
    </button>
  `;
}

function renderAquarium(activeReward, progress) {
  const displayItems = state.collection.slice(-7);
  const activeKey = activeReward?.key || null;
  return `
    <div class="tank-water">
      <div class="water-surface"><i></i><i></i></div>
      <div class="light-rays"></div>
      <div class="bubble-field" aria-hidden="true">
        ${Array.from({ length: 18 }, (_, index) => `<i style="--i:${index};--x:${(index * 37) % 96}%;--d:${7 + (index % 6) * 1.7}s;--s:${5 + (index % 5) * 3}px"></i>`).join("")}
      </div>
      <div class="plant plant-one"><i></i><i></i><i></i></div>
      <div class="plant plant-two"><i></i><i></i><i></i></div>
      <div class="sand"><i></i><i></i><i></i></div>
      ${renderAmbientFish()}
      ${displayItems.map((item, index) => renderTankItem(item.rewardKey, index + 3, false)).join("")}
      ${activeKey ? renderTankItem(activeKey, displayItems.length + 5, true, progress) : ""}
    </div>
  `;
}

function renderAmbientFish() {
  return [
    { key: "goldfish", x: 15, y: 27, delay: -1.4, scale: 0.76 },
    { key: "goldfish", x: 64, y: 45, delay: -5.2, scale: 0.58 },
    { key: "koi", x: 36, y: 62, delay: -8.1, scale: 0.66 }
  ].map((fish) => `
    <div class="tank-item ambient-fish ${fish.key}" style="--x:${fish.x}%;--y:${fish.y}%;--delay:${fish.delay}s;--reveal:${fish.scale}">
      ${renderCreature(fish.key)}
    </div>
  `).join("");
}

function renderTankItem(key, index, isActive, progress = 1) {
  const x = 12 + ((index * 23) % 72);
  const groundItems = new Set(["helmet", "boot", "wheel", "hermit", "lobster"]);
  const y = groundItems.has(key) ? 74 + (index % 3) * 3 : 20 + ((index * 17) % 48);
  const delay = -((index * 1.37) % 8);
  return `<div class="tank-item ${key} ${isActive ? "active-find" : ""}" ${isActive ? "data-active-find" : ""} style="--x:${x}%;--y:${y}%;--delay:${delay}s;--reveal:${Math.max(progress, 0.16)}">${renderCreature(key)}</div>`;
}

function renderCreature(key) {
  switch (key) {
    case "helmet":
      return '<span class="helmet-shape"><i class="helmet-window"></i><i class="helmet-grill"></i></span>';
    case "boot":
      return '<span class="boot-shape"><i></i><i></i></span>';
    case "wheel":
      return '<span class="wheel-shape"><i></i><i></i><i></i><i></i></span>';
    case "hermit":
      return '<span class="hermit-shape"><i class="hermit-shell"></i><i class="hermit-body"></i><i class="hermit-eye one"></i><i class="hermit-eye two"></i></span>';
    case "seahorse":
      return '<span class="seahorse-shape"><i class="seahorse-head"></i><i class="seahorse-body"></i><i class="seahorse-tail"></i><i class="seahorse-eye"></i></span>';
    case "lobster":
      return '<span class="lobster-shape"><i class="lobster-body"></i><i class="lobster-tail"></i><i class="lobster-claw one"></i><i class="lobster-claw two"></i></span>';
    case "turtle":
      return '<span class="turtle-shape"><i class="turtle-shell"></i><i class="turtle-head"></i><i class="turtle-flipper one"></i><i class="turtle-flipper two"></i><i class="turtle-flipper three"></i><i class="turtle-flipper four"></i></span>';
    default:
      return `<span class="fish-shape ${key}"><i class="fish-tail"></i><i class="fish-body"></i><i class="fish-fin"></i><i class="fish-eye"></i></span>`;
  }
}

function renderCollectionCategory(minutes) {
  const pool = getRewardPool(minutes);
  const unlocked = pool.items.reduce((count, reward) => count + (getCollectionCount(reward.key) > 0 ? 1 : 0), 0);
  return `
    <section class="collection-category">
      <div class="collection-category-heading">
        <div><span>${minutes} min</span><h3>${pool.label}</h3></div>
        <p>${unlocked} of ${pool.items.length} discovered</p>
      </div>
      <div class="collection-category-grid">
        ${pool.items.map((reward) => renderSpecimenCard(reward, minutes)).join("")}
      </div>
    </section>
  `;
}

function renderSpecimenCard(reward, minutes) {
  const count = getCollectionCount(reward.key);
  return `
    <article class="specimen-card ${count ? "unlocked" : "locked"}">
      <div class="specimen-visual ${reward.key}">
        <span class="rarity-tag">${count ? "Found" : "Undiscovered"}</span>
        ${renderCreature(reward.key)}
        <span class="specimen-count">× ${count}</span>
      </div>
      <div class="specimen-copy">
        <p>${minutes}-minute find</p>
        <h3>${reward.name}</h3>
        <span>${reward.description}</span>
      </div>
    </article>
  `;
}

function renderRecentFinds() {
  if (!state.collection.length) {
    return '<div class="collection-empty"><span>01</span><p>Complete your first focus dive and the collection log will begin here.</p></div>';
  }

  return `
    <div class="recent-finds">
      <div class="recent-heading"><p class="micro-label">Recent finds</p><span>Newest first</span></div>
      ${state.collection.slice(-5).reverse().map((item) => {
        const reward = getRewardByKey(item.rewardKey);
        return `<article><span class="tiny-find ${reward.key}">${renderCreature(reward.key)}</span><div><strong>${reward.name}</strong><small>${escapeHTML(item.task || "Focused session")}</small></div><time>${formatDate(item.completedAt)}</time></article>`;
      }).join("")}
    </div>
  `;
}

function renderMiniTimer() {
  const pool = getRewardPool(getDuration());
  const reward = getActiveReward() || pool.items[0];
  const progress = getProgress();
  return `
    <main class="mini-shell">
      <section class="mini-card">
        <div class="mini-aquarium">
          <div class="mini-bubbles"><i></i><i></i><i></i></div>
          ${renderCreature(reward.key)}
        </div>
        <div class="mini-main">
          <div class="mini-title"><span>Focus Aquarium</span><button data-action="expand">Full view</button></div>
          <p>${state.activeSession ? escapeHTML(state.activeSession.task) : `${pool.label} waiting`}</p>
          <strong data-live-time>${formatTime(getRemainingTime())}</strong>
          <div class="progress-wrap"><span data-live-progress style="width:${progress * 100}%"></span></div>
        </div>
        <div class="mini-actions">
          <button class="primary-action" data-action="start" ${state.activeSession ? "disabled" : ""}>${state.activeSession ? "Diving" : "Start"}</button>
          <button class="stop-action" data-action="cancel" ${state.activeSession ? "" : "disabled"}>Stop</button>
        </div>
      </section>
    </main>
  `;
}

function renderPopoutButton() {
  return '<button class="mini-button" data-action="popout"><span></span> Mini timer</button>';
}

function isMiniView() {
  return new URLSearchParams(window.location.search).get("view") === MINI_VIEW_PARAM;
}

function getMiniTimerUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("view", MINI_VIEW_PARAM);
  return url;
}

function openMiniTimer() {
  const miniWindow = window.open(getMiniTimerUrl().toString(), "focus-aquarium-mini", "popup,width=560,height=230,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no");
  if (miniWindow) miniWindow.focus();
  else window.location.href = getMiniTimerUrl().toString();
}

function openFullApp() {
  const url = new URL(window.location.href);
  url.searchParams.delete("view");
  window.location.href = url.toString();
}

function bindEvents() {
  app.querySelector("[data-task-input]")?.addEventListener("input", (event) => {
    if (state.activeSession) return;
    state = { ...state, selectedTask: event.currentTarget.value.slice(0, 80) };
    saveState();
  });

  app.querySelectorAll("[data-duration-minutes]").forEach((button) => {
    button.addEventListener("click", () => {
      const duration = Number(button.dataset.durationMinutes);
      if (state.activeSession || !DURATIONS.includes(duration)) return;
      setState((current) => ({ ...current, selectedDurationMinutes: duration }));
    });
  });

  app.querySelector('[data-action="start"]')?.addEventListener("click", startFocusSession);
  app.querySelector('[data-action="cancel"]')?.addEventListener("click", cancelFocusSession);
  app.querySelector('[data-action="popout"]')?.addEventListener("click", openMiniTimer);
  app.querySelector('[data-action="expand"]')?.addEventListener("click", openFullApp);
}
