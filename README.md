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

Year 1, capacity sized on the mean:

| Organization | Centres | Machines | For rounding | Utilization | Wait per visit | Parts waiting | Moves between centres |    Travel |    Floor |
| ------------ | ------: | -------: | -----------: | ----------: | -------------: | ------------: | --------------------: | --------: | -------: |
| Product      |       7 |       39 |       +14.70 |         62% |        5.0 min |          85.2 |                     0 | 195,412 m | 2,064 m² |
| Group        |       3 |       33 |        +8.70 |         74% |        7.6 min |         130.3 |                     0 | 151,485 m | 1,411 m² |
| Fractal, f=3 |       3 |       33 |        +8.70 |         74% |        6.2 min |         107.0 |                     0 | 157,734 m | 1,494 m² |
| Function     |       8 |       27 |        +2.70 |         90% |        3.4 min |          58.6 |                13,500 | 498,812 m | 1,386 m² |
| Process      |       3 |       26 |        +1.70 |         93% |        6.3 min |         108.6 |                 9,800 | 409,630 m | 1,675 m² |
| Holographic  |      27 |       27 |        +2.70 |         90% |       12.7 min |         218.9 |                13,500 | 551,997 m | 1,698 m² |

The work to be done is 24.30 processors' worth in every one of them. Four
things are being traded, and each organization pays in a different currency:

- **Machines.** The product organization buys 39 to do 24.30 machines' worth of
  work, because every centre rounds up on its own, and runs them at 62%.
- **Travel.** The function organization needs only 27, but every one of its
  13,500 moves a period crosses from one centre to another. The product
  organization makes none: each part is finished where it starts.
- **Waiting.** The holographic organization holds the same 27 machines as the
  function organization at the same utilization, yet a part waits 12.7 minutes
  against 3.4. Standing each machine up as its own centre costs nothing in
  capital and a great deal in queueing — five servers at 90% make a far shorter
  queue than five single servers at 90%. At any moment 218.9 parts stand in front
  of a machine against 58.6, and that is what buys the freedom to place them
  anywhere.
- **Floor.** The product organization needs 2,064 m² against the function
  organization's 1,386. The machines it buys have to stand somewhere.

Laid out, the account closes: the product organization carries parts 195,412
metres a period where the function organization carries them 498,812. The twelve
extra machines and the 678 m² of extra floor are what a product organization
spends to avoid that travel.

### What robustness costs

Demand is a random quantity with a coefficient of variation per product,
products independent. Capacity can be sized on the mean or so that a period's
demand is met with a stated probability.

| Capacity sized for | Machines | Utilization |
| ------------------ | -------: | ----------: |
| the mean           |       27 |         90% |
| 90% of periods     |       31 |         78% |
| 95% of periods     |       35 |         69% |
| 99% of periods     |       35 |         69% |

Pooling seven products leaves the function organization with a spread of only a
few per cent, which is why 95% and 99% land on the same whole machines. That is
a result worth showing rather than hiding: pooling is what makes robustness
cheap.

### Over four years

Demand grows 16% in total, but the mix turns over hard — P4 more than doubles,
P2 falls to a third, and P5 is withdrawn after Year 3. A machine of the same
operation leaving one centre while another needs one is moved rather than
bought, which is the whole reason an organization that must be torn up costs
more than one that only grows.

| Organization | Machines Y1–Y4    | Bought | Moved | Retired | Cost of change | Total capital |
| ------------ | ----------------- | -----: | ----: | ------: | -------------: | ------------: |
| Product      | 39 / 41 / 46 / 44 |      8 |     3 |       3 |         $2.08M |       $11.82M |
| Group        | 33 / 33 / 35 / 39 |      7 |     1 |       1 |         $1.77M |       $10.03M |
| Fractal, f=3 | 33 / 36 / 45 / 45 |     12 |     0 |       0 |         $3.00M |       $11.25M |
| Function     | 27 / 28 / 32 / 33 |      6 |     0 |       0 |         $1.50M |        $8.25M |
| Process      | 26 / 27 / 29 / 30 |      4 |     0 |       0 |         $1.00M |        $7.50M |
| Holographic  | 27 / 28 / 32 / 33 |      6 |     0 |       0 |         $1.50M |        $8.25M |

Two results worth pointing at. The product organization is the only one that
has to retire machines, because a withdrawn product closes its centre; and a
product centre cannot shrink below one machine per operation however far its
product declines, so a dying product keeps its capital and only loses its
utilization. The fractal organization is the most expensive to grow, because
capacity arrives one whole centre at a time.

The lecture case carries no prices, so the install and relocation figures are
this case's own. What matters to the comparison is the ratio.

### Two levels of layout

The lower level packs an operation's processors inside their centre; the upper
level packs the centres into the building, with a gangway between rows. Both are
shelf packing: deterministic, and enough to turn a count of moves into a distance
travelled and a count of machines into floor area. It sizes the space a design
would need, and is not itself one. Travel is rectilinear between centre centroids, the
way a vehicle on aisles moves.

Machine footprints are an assumption. The slides draw the machines at different
sizes but give no dimensions, and unlike the demand and the times there is no
count on a slide to calibrate them against. They are the one input here that
rests on nothing but judgement.

## Out of scope

- Work in process held between machines and between centres.
- Operators and operating cost, as against floor and capital.
- Setup times, which the lecture sets aside.

## Building a variant

Everything the case is made of can be changed in the page: demand for each
product in each year, the coefficient of variation of that demand, the minutes
each operation takes on each product, which products form each group, which
operations a composite centre carries, and how many centres the fractal
organization is split into.

The whole case travels as one JSON file. **Save this case** writes it out, **Load
a case** reads one back, and **Back to the lecture case** restores the one the
slides reconcile with. A variant can be built, kept and handed on, and the banner
says at once whether it still reproduces slide 19.

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

417 checks across three suites: the engine, the calibration, the robustness
model, Erlang C, the flow model, the two layout packers and the yearly timeline;
the page under `jsdom`, driven through every tab and control; and the built
single file. The layout checks assert that no two centres overlap, that every
centre is inside the building, and that a machine is drawn for every processor.

## Contact Us

For any questions about this tool, please contact Yinzhu Quan
([yquan9@gatech.edu](mailto:yquan9@gatech.edu)).
