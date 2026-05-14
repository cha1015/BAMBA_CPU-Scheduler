"use strict";

/* ── PROCESS COLORS ──────────────────────────────────────────
         Fixed palette of vibrant colors assigned to processes in order.
         Cycles if more than 12 processes are added. ── */
const PROCESS_COLORS = [
  "#e8650a",
  "#7c3aed",
  "#0d9488",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#059669",
];

/* ── ALGORITHM REGISTRY ──────────────────────────────────────
         Maps algorithm keys to display metadata and feature flags.
         needsQuantum → show the time-quantum input field.
         needsPriority → show the priority column in the process table. ── */
const ALGORITHMS = {
  fcfs: {
    name: "FCFS",
    full: "First-Come, First-Served",
    needsQuantum: false,
    needsPriority: false,
  },
  sjf: {
    name: "SJF",
    full: "Shortest Job First",
    needsQuantum: false,
    needsPriority: false,
  },
  srt: {
    name: "SRT",
    full: "Shortest Remaining Time",
    needsQuantum: false,
    needsPriority: false,
  },
  rr: {
    name: "RR",
    full: "Round Robin",
    needsQuantum: true,
    needsPriority: false,
  },
  priority_np: {
    name: "PRI-NP",
    full: "Priority (Non-Preemptive)",
    needsQuantum: false,
    needsPriority: true,
  },
  priority: {
    name: "PRI-P",
    full: "Priority (Preemptive)",
    needsQuantum: false,
    needsPriority: true,
  },
  priority_rr: {
    name: "P-RR",
    full: "Priority + Round Robin",
    needsQuantum: true,
    needsPriority: true,
  },
};

let selectedAlgo = "fcfs";
let lastResults = null;

const $ = (id) => document.getElementById(id);
const tbody = $("process-tbody");
const quantumField = $("quantum-field");
const priorityHdr = $("priority-header");
const priorityNote = $("priority-note");
const runBtn = $("run-btn");
const cmpAllBtn = $("compare-all-btn");
const progressWrap = $("progress-wrap");
const progressBar = $("progress-bar");
const progressPct = $("progress-pct");
const progressText = $("progress-text");
const resultsEl = $("results-section");
const ganttCanvas = $("gantt-canvas");
const ganttLegend = $("gantt-legend");
const resultsTbody = $("results-tbody");
const computeTbody = $("computation-tbody");
const avgFormulaBox = $("avg-formula-box");
const compareSec = $("compare-section");
const compareTbody = $("compare-tbody");
const tooltip = $("tooltip");
const toast = $("toast");

/* ══ ALGO SELECTION ════════════════════════════════════════ */
/* Highlights the chosen algorithm card and refreshes UI state. */
$("algo-grid").addEventListener("click", (e) => {
  const card = e.target.closest(".algo-card");
  if (!card) return;
  document
    .querySelectorAll(".algo-card")
    .forEach((c) => c.classList.remove("active"));
  card.classList.add("active");
  selectedAlgo = card.dataset.algo;
  updateAlgoUI();
});

/* Shows/hides the quantum field and priority column based on the
         selected algorithm's feature flags; updates sidebar labels. */
function updateAlgoUI() {
  const info = ALGORITHMS[selectedAlgo];
  quantumField.classList.toggle("visible", info.needsQuantum);
  priorityHdr.style.display = info.needsPriority ? "" : "none";
  priorityNote.classList.toggle("visible", info.needsPriority);
  document.querySelectorAll(".priority-cell").forEach((c) => {
    c.style.display = info.needsPriority ? "" : "none";
  });
  $("sidebar-algo-name").textContent = info.name;
  $("sidebar-algo-desc").textContent = info.full;
  $("run-algo-name").textContent = info.name + " — " + info.full;
}

/* ══ PROCESS TABLE ══════════════════════════════════════════ */
/* Appends a new editable process row. Assigns a color from the palette,
         auto-generates a PID if omitted, and wires up the delete button. */
function addRow(arrival = "0", burst = "", priority = "1", pid = "") {
  const color = PROCESS_COLORS[tbody.rows.length % PROCESS_COLORS.length];
  const id = pid || `P${tbody.rows.length + 1}`;
  const rowNum = tbody.rows.length + 1;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><span style="font-size:12px;color:var(--text3);font-weight:600">${rowNum}</span></td>
    <td><div class="process-id-cell">
      <span class="process-color-dot" style="background:${color}"></span>
      <input type="text" value="${id}" class="pid-input" style="width:64px" maxlength="8">
    </div></td>
    <td><input type="number" value="${arrival}" class="arrival-input" min="0" style="width:80px"></td>
    <td><input type="number" value="${burst}" class="burst-input" min="1" style="width:80px" placeholder="1"></td>
    <td class="priority-cell" style="display:${ALGORITHMS[selectedAlgo].needsPriority ? "" : "none"}">
      <input type="number" value="${priority}" class="priority-input" min="1" style="width:72px">
    </td>
    <td><button class="btn btn-ghost btn-icon btn-sm del-btn" title="Remove">✕</button></td>`;
  tbody.appendChild(tr);
  tr.querySelector(".del-btn").addEventListener("click", () => {
    if (tbody.rows.length <= 3) {
      showToast("Minimum 3 processes required.", "error");
      return;
    }
    tr.remove();
    renumberRows();
  });
}

/* Resets the sequential row-number labels after a row is deleted. */
function renumberRows() {
  [...tbody.rows].forEach((r, i) => {
    r.cells[0].innerHTML = `<span style="font-size:12px;color:var(--text3);font-weight:600">${i + 1}</span>`;
  });
}

function clearAll() {
  tbody.innerHTML = "";
}

/* Clears the table and populates it with 5 preset processes
         covering a range of arrivals, bursts, and priorities. */
function loadExample() {
  clearAll();
  [
    ["P1", 0, 6, 4], // Arrival 0, Burst 6, Priority 4
    ["P2", 1, 7, 2], // Arrival 1, Burst 7, Priority 2
    ["P3", 2, 3, 5], // Arrival 2, Burst 3, Priority 5
    ["P4", 3, 10, 1], // Arrival 3, Burst 10, Priority 1
    ["P5", 4, 5, 3], // Arrival 4, Burst 5, Priority 3
  ].forEach(([pid, a, b, p]) => addRow(a, b, p, pid));
  showToast("New example data loaded!", "success");
}

$("add-row-btn").addEventListener("click", () => addRow());
$("clear-all-btn").addEventListener("click", () => {
  clearAll();
  for (let i = 0; i < 3; i++) addRow();
});
$("load-example-btn").addEventListener("click", loadExample);

/* ══ PARSING ════════════════════════════════════════════════ */
/* Reads and validates all process rows from the table.
         Returns { processes } on success or { error } on invalid input. */
function parseProcesses() {
  const rows = [...tbody.rows];
  if (rows.length < 3) return { error: "Add at least 3 processes." };
  const ps = [];
  for (const tr of rows) {
    const pid =
      tr.querySelector(".pid-input").value.trim() || `P${ps.length + 1}`;
    const arr = parseFloat(tr.querySelector(".arrival-input").value);
    const bst = parseFloat(tr.querySelector(".burst-input").value);
    const priEl = tr.querySelector(".priority-input");
    const pri = priEl ? parseFloat(priEl.value) : 1;
    if (isNaN(arr) || arr < 0)
      return { error: `"${pid}": Arrival must be ≥ 0.` };
    if (isNaN(bst) || bst <= 0)
      return { error: `"${pid}": Burst must be > 0.` };
    if (ALGORITHMS[selectedAlgo].needsPriority && (isNaN(pri) || pri < 1))
      return { error: `"${pid}": Priority must be ≥ 1.` };
    ps.push({
      pid,
      arrival: arr,
      burst: bst,
      priority: isNaN(pri) || pri < 1 ? 1 : pri,
      color: PROCESS_COLORS[ps.length % PROCESS_COLORS.length],
    });
  }
  return { processes: ps };
}

/* Reads and validates the time-quantum input; returns { quantum } or { error }. */
function getQuantum() {
  const q = parseFloat($("quantum-input").value);
  if (isNaN(q) || q <= 0) return { error: "Time Quantum must be > 0." };
  return { quantum: q };
}

/* ══ ALGORITHMS ═════════════════════════════════════════════ */
/* Each runXxx function accepts a process array (and quantum where needed),
         simulates the schedule, and returns finalize(procs, gantt).
         All algorithms produce a gantt array of { pid, start, end, color }
         segments consumed by the Gantt chart renderer. */

/* FCFS: sorts by arrival time; runs each process to completion in order. */
function runFCFS(ps) {
  const procs = ps.map((p) => ({ ...p }));
  procs.sort((a, b) => a.arrival - b.arrival);
  const gantt = [];
  let time = 0;
  for (const p of procs) {
    if (time < p.arrival) time = p.arrival;
    p.start = time;
    p.completion = time + p.burst;
    gantt.push({
      pid: p.pid,
      start: time,
      end: p.completion,
      color: p.color,
    });
    time = p.completion;
  }
  return finalize(procs, gantt);
}

/* SJF: at each decision point picks the available process with the
         shortest burst time; non-preemptive — runs chosen process to completion. */
function runSJF(ps) {
  const procs = ps.map((p) => ({ ...p, done: false }));
  const gantt = [];
  let time = 0;
  let done = 0;
  while (done < procs.length) {
    const avail = procs.filter((p) => !p.done && p.arrival <= time);
    if (!avail.length) {
      time++;
      continue;
    }
    avail.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
    const p = avail[0];
    p.start = time;
    p.completion = time + p.burst;
    gantt.push({
      pid: p.pid,
      start: time,
      end: p.completion,
      color: p.color,
    });
    time = p.completion;
    p.done = true;
    done++;
  }
  return finalize(procs, gantt);
}

/* SRT: preemptive SJF — each tick picks the process with the least
         remaining time, merging adjacent same-process ticks into one Gantt segment. */
function runSRT(ps) {
  const procs = ps.map((p) => ({
    ...p,
    remaining: p.burst,
    done: false,
    started: false,
  }));
  const gantt = [];
  let time = 0;
  let done = 0;
  let prevPid = null;
  let seg = null;
  while (done < procs.length) {
    const avail = procs.filter((p) => !p.done && p.arrival <= time);
    if (!avail.length) {
      time++;
      continue;
    }
    avail.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);
    const p = avail[0];
    if (!p.started) {
      p.started = true;
    }
    if (prevPid !== p.pid) {
      if (seg) seg.end = time;
      seg = { pid: p.pid, start: time, end: time + 1, color: p.color };
      gantt.push(seg);
      prevPid = p.pid;
    } else {
      seg.end = time + 1;
    }
    p.remaining--;
    time++;
    if (p.remaining === 0) {
      p.done = true;
      p.completion = time;
      done++;
    }
  }
  return finalize(procs, gantt);
}

/* Round Robin: cycles through the ready queue, giving each process
         up to q time units per turn; newly arriving processes join the tail. */
function runRR(ps, q) {
  const procs = ps.map((p) => ({
    ...p,
    remaining: p.burst,
    done: false,
    started: false,
  }));
  procs.sort((a, b) => a.arrival - b.arrival);
  const gantt = [];
  let time = 0;
  let done = 0;
  const queue = [];
  let i = 0;
  while (i < procs.length && procs[i].arrival <= time) queue.push(procs[i++]);
  while (done < procs.length) {
    if (!queue.length) {
      time++;
      while (i < procs.length && procs[i].arrival <= time)
        queue.push(procs[i++]);
      continue;
    }
    const p = queue.shift();
    if (!p.started) {
      p.started = true;
    }
    const exec = Math.min(p.remaining, q);
    gantt.push({
      pid: p.pid,
      start: time,
      end: time + exec,
      color: p.color,
    });
    time += exec;
    p.remaining -= exec;
    while (i < procs.length && procs[i].arrival <= time) queue.push(procs[i++]);
    if (p.remaining > 0) queue.push(p);
    else {
      p.done = true;
      p.completion = time;
      done++;
    }
  }
  return finalize(procs, gantt);
}

/* Priority Non-Preemptive: selects the highest-priority (lowest number)
         available process and runs it to completion before re-evaluating. */
function runPriorityNP(ps) {
  const procs = ps.map((p) => ({ ...p, done: false }));
  const gantt = [];
  let time = 0;
  let done = 0;
  while (done < procs.length) {
    const avail = procs.filter((p) => !p.done && p.arrival <= time);
    if (!avail.length) {
      time++;
      continue;
    }
    avail.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
    const p = avail[0];
    p.start = time;
    p.completion = time + p.burst;
    gantt.push({
      pid: p.pid,
      start: time,
      end: p.completion,
      color: p.color,
    });
    time = p.completion;
    p.done = true;
    done++;
  }
  return finalize(procs, gantt);
}

/* Priority Preemptive: each tick selects the highest-priority available
         process; preempts the current process when a higher-priority one arrives. */
function runPriority(ps) {
  const procs = ps.map((p) => ({
    ...p,
    remaining: p.burst,
    done: false,
    started: false,
  }));
  const gantt = [];
  let time = 0;
  let done = 0;
  let prevPid = null;
  let seg = null;
  while (done < procs.length) {
    const avail = procs.filter((p) => !p.done && p.arrival <= time);
    if (!avail.length) {
      time++;
      continue;
    }
    avail.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
    const p = avail[0];
    if (!p.started) {
      p.started = true;
    }
    if (prevPid !== p.pid) {
      if (seg) seg.end = time;
      seg = { pid: p.pid, start: time, end: time + 1, color: p.color };
      gantt.push(seg);
      prevPid = p.pid;
    } else {
      seg.end = time + 1;
    }
    p.remaining--;
    time++;
    if (p.remaining === 0) {
      p.done = true;
      p.completion = time;
      done++;
    }
  }
  return finalize(procs, gantt);
}

/* Priority + Round Robin: groups processes by priority; within the
         top-priority group applies Round Robin with the configured quantum. */
function runPriorityRR(ps, q) {
  const procs = ps.map((p) => ({
    ...p,
    remaining: p.burst,
    done: false,
    started: false,
  }));
  procs.sort((a, b) => a.arrival - b.arrival);
  const gantt = [];
  let time = 0;
  let done = 0;
  const queue = [];
  let i = 0;
  while (i < procs.length && procs[i].arrival <= time) queue.push(procs[i++]);
  while (done < procs.length) {
    if (!queue.length) {
      time++;
      while (i < procs.length && procs[i].arrival <= time)
        queue.push(procs[i++]);
      continue;
    }
    queue.sort((a, b) => a.priority - b.priority);
    const topPri = queue[0].priority;
    const idx = queue.findIndex((p) => p.priority === topPri);
    const p = queue.splice(idx, 1)[0];
    if (!p.started) {
      p.response = time - p.arrival;
      p.started = true;
    }
    const exec = Math.min(p.remaining, q);
    gantt.push({
      pid: p.pid,
      start: time,
      end: time + exec,
      color: p.color,
    });
    time += exec;
    p.remaining -= exec;
    while (i < procs.length && procs[i].arrival <= time) queue.push(procs[i++]);
    if (p.remaining > 0) queue.push(p);
    else {
      p.done = true;
      p.completion = time;
      done++;
    }
  }
  return finalize(procs, gantt);
}

/* Computes derived metrics for each process after scheduling:
         TAT = completion − arrival, WT = TAT − burst.
         Also calculates aggregate stats: avgWT, avgTAT*/
function finalize(procs, gantt) {
  procs.forEach((p) => {
    p.tat = p.completion - p.arrival;
    p.wt = p.tat - p.burst;
    if (p.response === undefined) p.response = p.wt;
  });
  const n = procs.length;
  const totalBurst = procs.reduce((s, p) => s + p.burst, 0);
  const makespan =
    Math.max(...procs.map((p) => p.completion)) -
    Math.min(...procs.map((p) => p.arrival));
  const avgWT = procs.reduce((s, p) => s + p.wt, 0) / n;
  const avgTAT = procs.reduce((s, p) => s + p.tat, 0) / n;
  const util = (totalBurst / makespan) * 100;
  const tp = n / makespan;
  return { procs, gantt, avgWT, avgTAT, util, tp, makespan };
}

/* Dispatcher: routes the selected algorithm key to its implementation. */
function runAlgo(algo, ps, q) {
  switch (algo) {
    case "fcfs":
      return runFCFS(ps);
    case "sjf":
      return runSJF(ps);
    case "srt":
      return runSRT(ps);
    case "rr":
      return runRR(ps, q);
    case "priority_np":
      return runPriorityNP(ps);
    case "priority":
      return runPriority(ps);
    case "priority_rr":
      return runPriorityRR(ps, q);
  }
}

/* ══ SIMULATE ═══════════════════════════════════════════════ */
/* Validates input, shows animated progress, runs the selected algorithm,
         renders all output sections, and updates the sidebar quick-stats. */
async function simulate() {
  const parsed = parseProcesses();
  if (parsed.error) {
    showToast(parsed.error, "error");
    return;
  }
  let quantum = 2;
  if (ALGORITHMS[selectedAlgo].needsQuantum) {
    const qp = getQuantum();
    if (qp.error) {
      showToast(qp.error, "error");
      return;
    }
    quantum = qp.quantum;
  }
  progressWrap.classList.add("visible");
  progressBar.style.width = "0%";
  progressPct.textContent = "0%";
  progressText.textContent = "Running " + ALGORITHMS[selectedAlgo].full + "…";
  runBtn.disabled = true;
  await fakeProgress(0, 70, 300);
  lastResults = runAlgo(selectedAlgo, parsed.processes, quantum);
  await fakeProgress(70, 100, 150);
  progressWrap.classList.remove("visible");
  runBtn.disabled = false;
  compareSec.style.display = "none";
  renderResults(lastResults, selectedAlgo);
  updateQuickStats(lastResults);
  showToast("Simulation complete!", "success");
}

/* Animates the progress bar from `from`% to `to`% over `ms` milliseconds
         in 10 equal steps; resolves the returned Promise when done. */
function fakeProgress(from, to, ms) {
  return new Promise((res) => {
    const steps = 10;
    const step = (to - from) / steps;
    let cur = from;
    let count = 0;
    const iv = setInterval(() => {
      cur = Math.min(cur + step, to);
      count++;
      progressBar.style.width = cur + "%";
      progressPct.textContent = Math.round(cur) + "%";
      if (count >= steps) {
        clearInterval(iv);
        res();
      }
    }, ms / steps);
  });
}

/* ══ RENDER RESULTS ═════════════════════════════════════════ */
/* Populates the results section: stat cards, per-process table,
         Gantt chart, legend, and computation breakdown. Scrolls into view. */
function renderResults(r, algo) {
  resultsEl.classList.add("visible");
  $("results-desc").textContent =
    `Algorithm: ${ALGORITHMS[algo].full} · ${r.procs.length} processes · Makespan: ${r.makespan} units`;

  // Update the two summary stat cards with computed averages
  $("stat-awt").textContent = r.avgWT.toFixed(2);
  $("stat-atat").textContent = r.avgTAT.toFixed(2);

  // Build per-process rows: one row per process with timing metrics
  resultsTbody.innerHTML = "";
  r.procs.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="process-id-cell">
        <span class="process-color-dot" style="background:${p.color}"></span>
        <strong>${p.pid}</strong>
      </div></td>
      <td>${p.arrival}</td><td>${p.burst}</td>
      <td>${p.completion}</td><td>${p.tat}</td><td>${p.wt}</td>`;
    resultsTbody.appendChild(tr);
  });

  // Append an averages footer row to the per-process table
  // colspan="3" covers Process + Arrival + Burst; then CT=—, TAT avg, WT avg
  const avgTr = document.createElement("tr");
  avgTr.className = "avg-row";
  avgTr.innerHTML = `
    <td colspan="3" style="font-weight:700">Averages</td>
    <td>—</td>
    <td>${r.avgTAT.toFixed(2)}</td>
    <td>${r.avgWT.toFixed(2)}</td>`;
  resultsTbody.appendChild(avgTr);

  renderComputation(r);
  drawGantt(r.gantt, r.makespan);
  drawLegend(r.procs);
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ══ COMPUTATION BREAKDOWN ══════════════════════════════════ */
/* Builds the step-by-step derivation table: each row shows the
         arithmetic for TAT and WT, followed by sum and average formula rows. */
function renderComputation(r) {
  const n = r.procs.length;
  computeTbody.innerHTML = "";
  r.procs.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="process-id-cell">
        <span class="process-color-dot" style="background:${p.color}"></span>${p.pid}
      </div></td>
      <td>${p.arrival}</td><td>${p.burst}</td><td>${p.completion}</td>
      <td style="color:var(--purple);font-weight:600">${p.completion} − ${p.arrival} = <strong>${p.tat}</strong></td>
      <td style="color:var(--orange);font-weight:600">${p.tat} − ${p.burst} = <strong>${p.wt}</strong></td>`;
    computeTbody.appendChild(tr);
  });

  const sumWT = r.procs.reduce((s, p) => s + p.wt, 0);
  const sumTAT = r.procs.reduce((s, p) => s + p.tat, 0);
  const sumTr = document.createElement("tr");
  sumTr.className = "sum-row";
  sumTr.innerHTML = `
    <td colspan="4" style="text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Σ (Sum)</td>
    <td>ΣTAT = ${sumTAT}</td>
    <td>ΣWT = ${sumWT}</td>`;
  computeTbody.appendChild(sumTr);

  const wtParts = r.procs.map((p) => p.wt).join(" + ");
  const tatParts = r.procs.map((p) => p.tat).join(" + ");

  avgFormulaBox.innerHTML = `
            <div class="avg-formula-item tat">
      <div class="af-label">Average Turnaround Time (Avg TAT)</div>
      <div class="af-steps">
        Avg TAT = ΣTAT / n<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= (${tatParts}) / ${n}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ${sumTAT} / ${n}
      </div>
      <div class="af-result">= ${r.avgTAT.toFixed(2)}</div>
     </div>
      <div class="avg-formula-item wt">
      <div class="af-label">Average Waiting Time (Avg WT)</div>
      <div class="af-steps">
        Avg WT = ΣWT / n<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= (${wtParts}) / ${n}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ${sumWT} / ${n}
      </div>
      <div class="af-result">= ${r.avgWT.toFixed(2)}</div>
    </div>`;
}

/* Refreshes the sidebar "Last Run Stats" card with the four key metrics
         from the most recent simulation result. */
function updateQuickStats(r) {
  $("quick-stats").innerHTML = `
    <div class="qs-row">
      <span class="qs-label">Avg TAT</span>
      <span class="qs-val" style="color:var(--purple)">${r.avgTAT.toFixed(2)}</span>
    </div>
    <div class="qs-row">
      <span class="qs-label">Avg WT</span>
      <span class="qs-val" style="color:var(--orange)">${r.avgWT.toFixed(2)}</span>
    </div>`;
}

/* ══ GANTT CHART ════════════════════════════════════════════ */
/* Renders the Gantt chart on a <canvas> element. Draws a warm background,
         vertical grid lines at tick intervals, colored rounded segments for each
         CPU burst, a labelled time axis below, and wires up the hover tooltip. */
function drawGantt(gantt, makespan) {
  const wrap = ganttCanvas.parentElement;
  const W = Math.max(wrap.clientWidth - 8, 500);
  const H = 96;
  const BAR_Y = 10;
  const BAR_H = 54;
  const PAD_L = 32;
  const totalT = makespan || (gantt.length ? gantt[gantt.length - 1].end : 1);
  const scale = (W - PAD_L - 16) / totalT;

  ganttCanvas.width = W;
  ganttCanvas.height = H;
  const ctx = ganttCanvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  /* light warm background */
  ctx.fillStyle = "#fdf8f3";
  ctx.fillRect(0, 0, W, H);

  /* grid lines */
  ctx.strokeStyle = "#e8d8c8";
  ctx.lineWidth = 0.5;
  let tickInterval = 1;
  if (totalT > 60) tickInterval = 10;
  else if (totalT > 30) tickInterval = 5;
  else if (totalT > 15) tickInterval = 2;
  for (let t = 0; t <= totalT; t += tickInterval) {
    const x = PAD_L + t * scale;
    ctx.beginPath();
    ctx.moveTo(x, BAR_Y);
    ctx.lineTo(x, BAR_Y + BAR_H);
    ctx.stroke();
  }

  /* segments */
  gantt.forEach((seg) => {
    const x = PAD_L + seg.start * scale;
    const w = Math.max((seg.end - seg.start) * scale - 1, 1);

    /* shadow */
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(x, BAR_Y, w, BAR_H, 4)
      : ctx.fillRect(x, BAR_Y, w, BAR_H);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    /* top shine */
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x, BAR_Y, w, 5);

    /* border */
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, BAR_Y, w, BAR_H);

    /* label */
    if (w > 16) {
      const fs = Math.min(12, Math.max(8, w / 3));
      ctx.font = `700 ${fs}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(seg.pid, x + w / 2, BAR_Y + BAR_H / 2);
    }
  });

  /* time axis */
  const tickY = BAR_Y + BAR_H;
  ctx.strokeStyle = "#d4bfa8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD_L, tickY);
  ctx.lineTo(W - 16, tickY);
  ctx.stroke();

  ctx.fillStyle = "#8a7060";
  ctx.font = "500 9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let t = 0; t <= totalT; t += tickInterval) {
    const x = PAD_L + t * scale;
    ctx.strokeStyle = "#b8a090";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, tickY);
    ctx.lineTo(x, tickY + 5);
    ctx.stroke();
    ctx.fillStyle = "#8a7060";
    ctx.fillText(t, x, tickY + 7);
  }
  const endX = PAD_L + totalT * scale;
  ctx.strokeStyle = "#b8a090";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(endX, tickY);
  ctx.lineTo(endX, tickY + 5);
  ctx.stroke();
  ctx.fillStyle = "#8a7060";
  ctx.fillText(totalT, endX, tickY + 7);

  setupTooltip(ganttCanvas, gantt, scale, PAD_L, BAR_Y, BAR_H);
}

/* Attaches mousemove/mouseleave handlers to the canvas; shows a floating
         tooltip with PID, start/end times, and duration when hovering a segment. */
function setupTooltip(canvas, gantt, scale, padL, barY, barH) {
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (my < barY || my > barY + barH) {
      tooltip.classList.remove("show");
      return;
    }
    const t = (mx - padL) / scale;
    const seg = gantt.find((s) => t >= s.start && t <= s.end);
    if (!seg) {
      tooltip.classList.remove("show");
      return;
    }
    tooltip.innerHTML =
      `<span style="color:${seg.color};font-weight:800">${seg.pid}</span><br>` +
      `Start: ${seg.start}  ·  End: ${seg.end}<br>` +
      `Duration: <strong>${seg.end - seg.start}</strong>`;
    tooltip.style.left = e.clientX + 14 + "px";
    tooltip.style.top = e.clientY - 14 + "px";
    tooltip.classList.add("show");
  };
  canvas.onmouseleave = () => tooltip.classList.remove("show");
}

/* Builds the color-swatch legend below the Gantt chart;
         deduplicates PIDs so each process appears only once. */
function drawLegend(procs) {
  ganttLegend.innerHTML = "";
  const seen = new Set();
  procs.forEach((p) => {
    if (seen.has(p.pid)) return;
    seen.add(p.pid);
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-swatch" style="background:${p.color}"></span>${p.pid}`;
    ganttLegend.appendChild(item);
  });
}

/* ══ COMPARE ALL ════════════════════════════════════════════ */
/* Runs all 7 algorithms on the same input, animates a shared progress bar,
         then populates the comparison table — highlighting the best value per column. */
cmpAllBtn.addEventListener("click", async () => {
  const parsed = parseProcesses();
  if (parsed.error) {
    showToast(parsed.error, "error");
    return;
  }
  let quantum = 2;
  const qp = getQuantum();
  if (!qp.error) quantum = qp.quantum;

  progressWrap.classList.add("visible");
  progressText.textContent = "Running all 7 algorithms…";
  cmpAllBtn.disabled = true;
  runBtn.disabled = true;

  const keys = Object.keys(ALGORITHMS);
  const rows = [];
  for (let i = 0; i < keys.length; i++) {
    await fakeProgress(
      (i / keys.length) * 90,
      ((i + 1) / keys.length) * 90,
      100,
    );
    const r = runAlgo(keys[i], parsed.processes, quantum);
    rows.push({ key: keys[i], ...r });
  }
  await fakeProgress(90, 100, 100);
  progressWrap.classList.remove("visible");
  cmpAllBtn.disabled = false;
  runBtn.disabled = false;

  const bestWT = Math.min(...rows.map((r) => r.avgWT));
  const bestTAT = Math.min(...rows.map((r) => r.avgTAT));

  compareTbody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    const cl = (v, best) => (v === best ? ' class="best"' : "");
    tr.innerHTML = `
      <td style="font-weight:600">${ALGORITHMS[r.key].full}</td>
      <td${cl(r.avgTAT, bestTAT)}>${r.avgTAT.toFixed(2)}</td>
      <td${cl(r.avgWT, bestWT)}>${r.avgWT.toFixed(2)}</td>`;
    compareTbody.appendChild(tr);
  });

  lastResults = runAlgo(selectedAlgo, parsed.processes, quantum);
  renderResults(lastResults, selectedAlgo);
  updateQuickStats(lastResults);
  compareSec.style.display = "block";
  compareSec.scrollIntoView({ behavior: "smooth" });
  showToast("All 7 algorithms compared! Green = best per column.", "success");
});

/* ══ TOAST ══════════════════════════════════════════════════ */
/* Displays a brief notification banner (success / error) that auto-hides
         after 3.2 seconds; a new call resets the timer. */
let toastTimer;
function showToast(msg, type = "") {
  toast.textContent = msg;
  toast.className = "toast show" + (type ? " " + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ══ INIT ═══════════════════════════════════════════════════ */
/* Wires the Run button, pre-loads example data, and syncs the
         algorithm UI to the default selection (FCFS). */
runBtn.addEventListener("click", simulate);
loadExample();
updateAlgoUI();
