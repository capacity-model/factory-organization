# :factory: Factory Organization Designer

The seven-product factory organization case from the lecture, with the numbers
attached. Developed for **ISyE 6202 & 6335 — Supply Chain Facilities** at the
Georgia Institute of Technology (Instructor: Prof. Benoit Montreuil).

- **Live app:** https://capacity-model.github.io/factory-organization/

## What it is for

The lecture shows the organizational networks — product, group, fractal,
function, process, holographic — as diagrams. The capacity computation and the
assignment of work to equipment are described, but not shown with numbers.

This tool attaches the numbers. From a demand per product and a process time per
operation per product it computes, for each organization, how many processors
each centre needs and how busy each one is, so the contrast between
organizations can be read off rather than asserted.

## The rule the whole tool runs on

```
processors in a centre = ceil( work the centre is given / work one processor can do )
utilization            = work given / (processors × work one processor can do)
```

Everything that distinguishes one organization from another is **which work
lands in which centre before that ceiling is taken**. The work to be done never
changes; splitting the factory finer only means more ceilings, and every ceiling
wastes a fraction of a machine.

## The case, and how its data was obtained

Seven products and eight operations, read off slide 3 of _Supply Chain Facility
Organization Design Fundamentals_ (version 2025/10/14), after Montreuil B. & P.
Lefrançois (1996), _Organizing Factories as Responsibility Networks_.

The slides carry the routings and the equipment counts but no demand and no
operation times. Those two are therefore synthetic, chosen by **reverse
calibration**: demand and times were fitted until the function organization
computes exactly the processors drawn on slide 19.

| Centre | Operation            | Drawn on slide 19 | Computed |
| ------ | -------------------- | ----------------: | -------: |
| F1     | blue circle          |                 5 |        5 |
| F2     | cyan ellipse         |                 6 |        6 |
| F3     | red rectangle        |                 2 |        2 |
| F4     | yellow parallelogram |                 3 |        3 |
| F5     | orange rectangle     |                 3 |        3 |
| F6     | green gear           |                 3 |        3 |
| F7     | purple hexagon       |                 1 |        1 |
| F8     | orange trapezoid     |                 4 |        4 |
|        | **total**            |            **27** |   **27** |

Operation times land between 0.79 and 2.08 minutes per unit, the same order of
magnitude across products for a given operation. A period is one 20-hour workday
at 80% processor efficiency, the convention slide 64 uses, so one processor
offers 960 minutes of work per period.

The page checks this calibration continuously. Change a demand and the banner
turns amber the moment the function organization stops reproducing slide 19.

## What it computes today

| Organization | Centres | Machines | Bought for rounding | Average utilization |
| ------------ | ------: | -------: | ------------------: | ------------------: |
| Product      |       7 |       39 |              +14.70 |                 62% |
| Group        |       3 |       33 |               +8.70 |                 74% |
| Fractal, f=3 |       3 |       33 |               +8.70 |                 74% |
| Function     |       8 |       27 |               +2.70 |                 90% |
| Process      |       3 |       26 |               +1.70 |                 94% |
| Holographic  |      27 |       27 |               +2.70 |                 90% |

The two end points are the ones stated in the lecture: the product organization
needs the most equipment, the function organization the least. The work itself
is 24.30 processors' worth in every one of them — the product organization buys
39 machines to do what 24.30 machines' worth of work requires, and runs them at
62%.

## One result that needs a decision

A composite centre is modelled with processors **flexible across the operations
of that centre**, which is what slide 67 does when it prints FLEX PROCESS 39
against FUNCTION+HOLO 46. Pooling across operations beats pooling within one, so
the process organization comes out at 26 machines, one below the function
organization's 27.

The function organization is therefore the leanest only among designs whose
processors are dedicated to a single operation. Whether to keep this flexible
reading, or model composite centres with dedicated machines, is open.

## Not modelled yet

- Several periods, and the cost of relayout between them. Demand is already held
  per period in the data, so years can be added without reworking the engine.
- Demand as a distribution, and capacity sized for a stated robustness.
- Queues, waiting time and work in process.
- Layout, inside a centre and across the factory.
- Travel, flow and traffic between centres.
- Operators, floor space and cost.

## Built with

Plain **HTML, CSS and JavaScript** — no frameworks, no build step for the user.
The published `index.html` is one self-contained file.

## Usage

Open **https://capacity-model.github.io/factory-organization/** in any browser —
nothing to install.

To run it locally, download `index.html` and open it directly, or serve the
folder:

```bash
python -m http.server
```

Then visit http://localhost:8000.

## Source

`index.html` at the root is the built single file. It is generated from `src/`:

| File                      | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `src/case.js`             | the case: products, routings, times, demand   |
| `src/engine.js`           | the capacity engine and the six organizations |
| `src/app.js`              | the page                                      |
| `src/index.html`          | shell and styles, loads the three sources     |
| `src/build_standalone.js` | inlines them into the published `index.html`  |

```bash
cd src && node build_standalone.js
```

## Tests

```bash
cd src && ./tests/run.sh
```

179 checks across three suites: the engine and the calibration, the page under
`jsdom`, and the built single file.

## Contact Us

For any questions about this tool, please contact Yinzhu Quan
([yquan9@gatech.edu](mailto:yquan9@gatech.edu)).
