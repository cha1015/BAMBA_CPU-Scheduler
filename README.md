# CPU Scheduler Simulator

An interactive, browser-based simulator for visualizing and comparing classic CPU scheduling algorithms. No installation or dependencies required — just open `index.html` in any modern browser.

---

## Getting Started

1. Download or clone the repository.
2. Open `index.html` in your browser.
3. Follow the three-step workflow on the page.

---

## How to Use

### Step 1 — Select an Algorithm

Click any algorithm card to select it. The simulator supports seven algorithms:

| Algorithm | Type | Description |
|---|---|---|
| **FCFS** — First-Come, First-Served | Non-Preemptive | Runs processes in arrival order. Simple but can cause the convoy effect. |
| **SJF** — Shortest Job First | Non-Preemptive | Picks the process with the shortest burst time. Minimizes average waiting time. |
| **SRT** — Shortest Remaining Time | Preemptive | Preemptive version of SJF. Interrupts the running process when a shorter job arrives. |
| **RR** — Round Robin | Preemptive | Each process gets a fixed time quantum in rotation. Fair time-sharing. |
| **PRI-NP** — Priority (Non-Preemptive) | Non-Preemptive | Runs the highest-priority ready process to completion. |
| **PRI-P** — Priority (Preemptive) | Preemptive | Preempts the running process when a higher-priority job arrives. |
| **P-RR** — Priority + Round Robin | Preemptive | Priority-based scheduling with Round Robin among processes of equal priority. |

> **Preemptive vs. Non-Preemptive:** Non-preemptive algorithms run a process until it finishes. Preemptive algorithms can interrupt a running process.

---

### Step 2 — Configure Processes

The process table starts pre-loaded with example data. You can:

- **Edit** any field directly in the table (Process ID, Arrival Time, Burst Time, and Priority if applicable).
- **Add Process** — adds a new row with default values.
- **Clear All** — resets the table to 3 blank rows.
- **Load Example** — fills the table with 5 preset processes for quick testing.

A minimum of **3 processes** is required to run a simulation.

**Field rules:**
- Arrival Time must be ≥ 0
- Burst Time must be > 0
- Priority must be ≥ 1 (only shown for priority-based algorithms)

> **Priority rule:** Lower number = higher priority. Priority 1 is the highest. Ties are broken by arrival time.

**Settings panel (left sidebar):**
- **Time Quantum** — appears when Round Robin or Priority + RR is selected. Sets the fixed time slice each process receives per turn (must be > 0).
- **Selected Algorithm** — displays the currently active algorithm for reference.

---

### Step 3 — Run and Read Results

#### Run Simulation

Click **▶ Run Simulation** to simulate the selected algorithm on your current process data. A progress bar will animate while the simulation runs.

Results include:

**Gantt Chart** — A timeline showing which process ran at each point in time. Hover over any segment to see its process ID, start time, end time, and duration.

**Average Stats** — High-level summary cards showing:
- Average Turnaround Time (Avg TAT)
- Average Waiting Time (Avg WT)

**Per-Process Summary** — A table with each process's computed metrics:
- Completion Time (CT)
- Turnaround Time (TAT = CT − Arrival Time)
- Waiting Time (WT = TAT − Burst Time)

**Computation Breakdown** — A step-by-step derivation showing the formulas used and how the averages are calculated from individual process values.

#### Compare All Algorithms

Click **⚖️ Compare All** to run all 7 algorithms on the same process input simultaneously. The comparison table shows the Average TAT and Average WT for every algorithm side by side, with the best (lowest) value in each column highlighted in green.

---

## Browser Compatibility

Works in any modern browser that supports the HTML5 Canvas API (Chrome, Firefox, Edge, Safari). No build step, no server, no internet connection required after the page loads.
