# :factory: Factory Organization Designer

The seven-product factory organization case from the lecture, with the numbers
attached: demand, process times, and the capacity each organization needs to
meet them. Developed for **ISyE 6202 & 6335 — Supply Chain Facilities** at the
Georgia Institute of Technology (Instructor: Prof. Benoit Montreuil).

- **Live app:** https://capacity-model.github.io/factory-organization/

## What it does

### Capacity

- **Six organizations** — product, group, fractal, function, process and
  holographic, each built from the same seven products and eight operations.
- **Processors and utilization** — how many machines every centre needs and how
  busy each one is, computed from demand and process times alone.
- **Robustness** — size capacity for mean demand or for a service level, and see
  what the cover costs in machines.
- **Queueing** — the waiting time and the parts waiting in front of every
  station, from Erlang C on its offered load.

### Network and layout

- **Organizational network** — the flow between centres and the work that never
  leaves one, with each arc drawn to the traffic it carries.
- **Two levels of layout** — processors packed inside their centre, centres
  packed into the building, with the travel and the floor area that follow.

### Over the years

- **Four years of demand** — the machines bought, moved and retired between one
  year and the next, and what the change costs.
- **Side by side** — machines, utilization, waiting, travel and floor for all six
  organizations at once.

### The case

Every figure can be edited in the page — demand, variability, process times,
groups, composite centres — and the whole case saves and loads as one JSON file.
A standing check reports whether the case still reproduces the processor counts
drawn in the lecture.

## Built with

Plain **HTML, CSS, and JavaScript** in a single self-contained file
(`index.html`) — no frameworks and no build step.

## Usage

Open **https://capacity-model.github.io/factory-organization/** in any browser —
nothing to install.

To run it locally, download `index.html` and open it directly, or serve the
folder:

```bash
python -m http.server
```

Then visit http://localhost:8000.

## Contact Us

For any questions about this interactive tool, please contact Yinzhu Quan
([yquan9@gatech.edu](mailto:yquan9@gatech.edu)).
