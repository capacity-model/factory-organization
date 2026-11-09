/* Factory Organization Designer — the case
 *
 * The seven-product case Prof. Montreuil teaches from, read off slide 3 of
 * "Supply Chain Facility Organization Design Fundamentals" (version 2025/10/14),
 * itself from Montreuil B. & P. Lefrancois (1996), Organizing Factories as
 * Responsibility Networks.
 *
 * The slides carry the routings and the equipment counts but no demand and no
 * operation times, so those two are synthetic. They were chosen by reverse
 * calibration: demand and times were fitted until the function organization
 * computes exactly the processor counts drawn on slide 19.
 */

var CASE = {
  period: {
    // Slide 64 of the same deck sets a period to a 20-hour workday at 80%
    // processor efficiency. Reused here so the numbers stay in his convention.
    hours: 20,
    efficiency: 0.8,
    label: "one 20-hour workday",
  },

  // A processor's footprint in metres, the floor it needs to itself including
  // the operator's place and the room to load and unload it. The slides draw
  // the machines at different sizes but give no dimensions, so these are
  // synthetic like the demand and the times, and unlike those two they have no
  // count on a slide to be calibrated against. They are the one input here
  // that is a plain assumption.
  operations: [
    {
      id: "O1",
      name: "blue circle",
      shape: "circle",
      fill: "#5b9bd5",
      w: 3,
      h: 3,
    },
    {
      id: "O2",
      name: "cyan ellipse",
      shape: "ellipse",
      fill: "#4fc3e8",
      w: 4,
      h: 2.5,
    },
    {
      id: "O3",
      name: "red rectangle",
      shape: "rect",
      fill: "#e05a5a",
      w: 5,
      h: 3,
    },
    {
      id: "O4",
      name: "yellow parallelogram",
      shape: "para",
      fill: "#f2ce1b",
      w: 3,
      h: 2,
    },
    {
      id: "O5",
      name: "orange rectangle",
      shape: "rect",
      fill: "#f2994a",
      w: 4,
      h: 3,
    },
    {
      id: "O6",
      name: "green gear",
      shape: "gear",
      fill: "#9ccc65",
      w: 2.5,
      h: 2.5,
    },
    {
      id: "O7",
      name: "purple hexagon",
      shape: "hex",
      fill: "#a98bd8",
      w: 6,
      h: 4,
    },
    {
      id: "O8",
      name: "orange trapezoid",
      shape: "trap",
      fill: "#e8a33d",
      w: 3.5,
      h: 3,
    },
  ],

  // Demand is held per period. Year 1 carries the calibrated demand, so the
  // reconciliation against slide 19 is always read on Year 1.
  periods: ["Year 1", "Year 2", "Year 3", "Year 4"],

  // demand per period, and the coefficient of variation of that demand.
  // Year 1 is the calibrated column; later years grow and shrink unevenly, and
  // P5 is withdrawn after Year 3, so an organization good in Year 1 is not
  // automatically good in Year 4.
  products: [
    {
      id: "P1",
      demand: [450, 520, 600, 690],
      cv: 0.15,
      route: ["O1", "O2", "O3", "O4", "O5", "O6"],
    },
    {
      id: "P2",
      demand: [500, 420, 300, 180],
      cv: 0.2,
      route: ["O1", "O2", "O3", "O7", "O8"],
    },
    {
      id: "P3",
      demand: [400, 430, 450, 470],
      cv: 0.18,
      route: ["O2", "O8", "O1", "O4", "O5", "O6"],
    },
    {
      id: "P4",
      demand: [350, 470, 640, 860],
      cv: 0.25,
      route: ["O2", "O8", "O1", "O5", "O4", "O6"],
    },
    {
      id: "P5",
      demand: [300, 240, 170, 0],
      cv: 0.12,
      route: ["O5", "O3", "O2", "O1", "O4", "O6"],
    },
    {
      id: "P6",
      demand: [550, 620, 700, 790],
      cv: 0.2,
      route: ["O1", "O8", "O4", "O2", "O5"],
    },
    {
      id: "P7",
      demand: [450, 460, 470, 480],
      cv: 0.15,
      route: ["O1", "O4", "O8", "O2", "O5"],
    },
  ],

  // minutes per unit, by operation and product
  times: {
    O1: { P1: 1.63, P2: 1.57, P3: 1.32, P4: 1.2, P5: 1.39, P6: 1.31, P7: 1.59 },
    O2: {
      P1: 1.53,
      P2: 1.68,
      P3: 1.78,
      P4: 2.08,
      P5: 1.71,
      P6: 1.51,
      P7: 1.94,
    },
    O3: { P1: 1.44, P2: 1.17, P5: 1.65 },
    O4: { P1: 1.13, P3: 1.05, P4: 1.09, P5: 0.8, P6: 1.01, P7: 1.09 },
    O5: { P1: 1.1, P3: 0.99, P4: 0.79, P5: 0.97, P6: 1.06, P7: 1.22 },
    O6: { P1: 1.98, P3: 1.56, P4: 1.89, P5: 1.38 },
    O7: { P2: 1.73 },
    O8: { P2: 1.58, P3: 1.14, P4: 1.72, P6: 1.45, P7: 1.8 },
  },

  // What slide 19 draws, per function center. The calibration target.
  drawn: { O1: 5, O2: 6, O3: 2, O4: 3, O5: 3, O6: 3, O7: 1, O8: 4 },

  // Default groupings, editable in the page.
  groups: [
    { id: "G-A", products: ["P1", "P2", "P5"] },
    { id: "G-B", products: ["P3", "P4"] },
    { id: "G-C", products: ["P6", "P7"] },
  ],
  processCenters: [
    { id: "p1", ops: ["O1", "O2"] },
    { id: "p2", ops: ["O3", "O4", "O5"] },
    { id: "p3", ops: ["O6", "O7", "O8"] },
  ],
  fractalCount: 3,

  // The lecture case carries no prices. These are placeholders so the cost of
  // changing a factory year on year has a shape; they are meant to be replaced
  // with real figures. What matters is the ratio: moving a machine is cheaper
  // than buying one, and that is what makes an inflexible organization expensive.
  money: {
    install: 250000, // a new processor, delivered and installed
    relocate: 25000, // moving an existing processor to another centre
    floor: 2700, // one square metre of factory floor, built
    currency: "$",
  },

  // Room left around the machines: inside a centre for the operator and the
  // parts waiting at the machine, and between centres for the aisles that
  // carry work from one to the next.
  space: {
    insideCentre: 0.45, // of the machine footprint, added as working room
    betweenCentres: 0.3, // of the centre area, added as aisle
    aisle: 3, // metres of gangway drawn between rows of centres
  },

  // Service levels offered for capacity robustness, as he asked: size capacity
  // so demand is met with a stated probability rather than on the average.
  serviceLevels: [
    { label: "mean", p: 0.5, z: 0 },
    { label: "90%", p: 0.9, z: 1.2816 },
    { label: "95%", p: 0.95, z: 1.6449 },
    { label: "99%", p: 0.99, z: 2.3263 },
  ],
};
