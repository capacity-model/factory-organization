var fs = require("fs");
var path = require("path");
var dir = path.join(__dirname, "..");
eval(fs.readFileSync(path.join(dir, "case.js"), "utf8"));
var Engine = require(path.join(dir, "engine.js"));

var fails = 0,
  checks = 0;
function ok(name, cond, extra) {
  checks++;
  if (!cond) {
    fails++;
    console.log("  FAIL " + name + (extra ? "  " + extra : ""));
  }
}

// 1. the period convention is his own: slide 64, 20-hour day at 80%
ok(
  "available minutes = 960",
  Engine.availableMinutes(CASE) === 960,
  "got " + Engine.availableMinutes(CASE),
);

// 2. the calibration reproduces every count drawn on slide 19
var cal = Engine.calibration(CASE, 0);
cal.rows.forEach(function (r) {
  ok("drawn " + r.op + " = " + r.drawn, r.ok, "computed " + r.computed);
  ok(
    "utilization " + r.op + " in 80-97%",
    r.utilization > 0.8 && r.utilization < 0.97,
    (r.utilization * 100).toFixed(1) + "%",
  );
});
ok(
  "calibration total 27",
  cal.computedTotal === 27 && cal.drawnTotal === 27,
  cal.computedTotal + " vs " + cal.drawnTotal,
);
ok("calibration reports ok", cal.ok === true);

// 3. every operation time sits in the band he asked for: seconds to minutes
Engine.allOps(CASE).forEach(function (op) {
  var row = CASE.times[op];
  Object.keys(row).forEach(function (p) {
    ok(
      "time " + op + "/" + p + " within 0.25-5 min",
      row[p] >= 0.25 && row[p] <= 5,
      row[p],
    );
  });
});

// 4. a product's route may only use operations that have a time for it
CASE.products.forEach(function (p) {
  p.route.forEach(function (op) {
    ok("time exists " + op + "/" + p.id, Engine.timeOf(CASE, op, p.id) > 0);
  });
});

// 5. his two claims about the end points
var res = {};
Engine.ORGANIZATIONS.forEach(function (o) {
  res[o.id] = Engine.evaluate(CASE, o.id, 0);
});
var counts = Object.keys(res).map(function (k) {
  return res[k].processors;
});
// Among the organizations whose processors are dedicated to one operation, the
// function organization pools the most and so needs the fewest machines. The
// process organization is excluded because its processors are flexible across
// the operations of their centre, which pools wider still — the saving his own
// slide 67 shows as FLEX PROCESS 39 against FUNCTION+HOLO 46.
var dedicated = ["product", "group", "fractal", "function", "holographic"];
var dedCounts = dedicated.map(function (k) {
  return res[k].processors;
});
ok(
  "function needs the fewest among dedicated-processor organizations",
  res.function.processors === Math.min.apply(null, dedCounts),
  JSON.stringify(
    dedicated.map(function (k) {
      return k + ":" + res[k].processors;
    }),
  ),
);
ok(
  "product organization needs the most",
  res.product.processors === Math.max.apply(null, counts),
);
ok(
  "flexible processors beat the function pool",
  res.process.processors < res.function.processors,
  res.process.processors + " vs " + res.function.processors,
);
ok(
  "function = 27",
  res.function.processors === 27,
  "" + res.function.processors,
);
ok("product = 39", res.product.processors === 39, "" + res.product.processors);

// 6. the invariant behind the whole lesson: total work never changes,
//    only how many ceilings are taken on it
var work = res.function.minutes;
Object.keys(res).forEach(function (k) {
  ok(
    "same total work in " + k,
    Math.abs(res[k].minutes - work) < 1e-6,
    res[k].minutes + " vs " + work,
  );
  ok(
    "processors cover the work in " + k,
    res[k].processors >= res[k].theoretical - 1e-9,
  );
  ok("rounding waste non-negative in " + k, res[k].rounding >= -1e-9);
  ok(
    "utilization in (0,1] in " + k,
    res[k].utilization > 0 && res[k].utilization <= 1 + 1e-9,
  );
});

// 7. splitting finer never needs fewer machines than pooling everything
ok("product >= function", res.product.processors >= res.function.processors);
ok("group >= function", res.group.processors >= res.function.processors);
ok("fractal >= function", res.fractal.processors >= res.function.processors);

// 8. holographic keeps the function machine count but scatters it
ok(
  "holographic machine count = function",
  res.holographic.processors === res.function.processors,
  res.holographic.processors + " vs " + res.function.processors,
);
ok(
  "holographic has one processor per centre",
  res.holographic.centres.every(function (c) {
    return c.processors === 1;
  }),
);
ok(
  "holographic has more centres than function",
  res.holographic.centreCount > res.function.centreCount,
);

// 9. a composite centre pools its ceilings, so process <= function
ok(
  "process <= function",
  res.process.processors <= res.function.processors,
  res.process.processors + " vs " + res.function.processors,
);

// 10. every product is served exactly once by product and group organizations
ok(
  "product organization has one centre per product",
  res.product.centreCount === CASE.products.length,
);
var seen = [];
CASE.groups.forEach(function (g) {
  g.products.forEach(function (p) {
    seen.push(p);
  });
});
ok(
  "groups cover every product once",
  seen.length === CASE.products.length &&
    seen.slice().sort().join() ===
      CASE.products
        .map(function (p) {
          return p.id;
        })
        .sort()
        .join(),
);

// 11. fractal with f = 1 is the function organization's machine count
var save = CASE.fractalCount;
CASE.fractalCount = 1;
ok(
  "fractal f=1 equals function",
  Engine.evaluate(CASE, "fractal", 0).processors === 27,
  "" + Engine.evaluate(CASE, "fractal", 0).processors,
);
CASE.fractalCount = save;

// 12. demand is held per period from the start
ok(
  "demand is an array per product",
  CASE.products.every(function (p) {
    return Array.isArray(p.demand);
  }),
);
ok("four periods", CASE.periods.length === 4);
ok(
  "a demand for every period",
  CASE.products.every(function (p) {
    return p.demand.length === CASE.periods.length;
  }),
);
ok(
  "every product carries a coefficient of variation",
  CASE.products.every(function (p) {
    return typeof p.cv === "number" && p.cv >= 0 && p.cv <= 1;
  }),
);
ok(
  "Year 1 demand is still the calibrated column",
  CASE.products
    .map(function (p) {
      return p.demand[0];
    })
    .join() === "450,500,400,350,300,550,450",
);

// 13. capacity sized for a stated robustness, as the lecture asks
var mean = Engine.evaluate(CASE, "function", 0, 0);
var p95 = Engine.evaluate(
  CASE,
  "function",
  0,
  CASE.serviceLevels.filter(function (s) {
    return s.label === "95%";
  })[0].z,
);
ok("robustness never needs fewer machines", p95.processors >= mean.processors);
ok(
  "95% needs more than the mean",
  p95.processors > mean.processors,
  p95.processors + " vs " + mean.processors,
);
ok("robustness lowers utilization", p95.utilization < mean.utilization);
ok(
  "the service levels are ordered",
  CASE.serviceLevels.every(function (s, i, a) {
    return i === 0 || (s.z > a[i - 1].z && s.p > a[i - 1].p);
  }),
);
ok("the mean level has z = 0", CASE.serviceLevels[0].z === 0);
ok(
  "machine counts rise with the service level",
  CASE.serviceLevels
    .map(function (s) {
      return Engine.evaluate(CASE, "function", 0, s.z).processors;
    })
    .every(function (n, i, a) {
      return i === 0 || n >= a[i - 1];
    }),
);

// 14. the spread of work respects that one product's demand moves together
var one = Engine.workStats(CASE, ["O1"], ["P1"], 0, 1);
ok(
  "a single product's spread is cv times its mean",
  Math.abs(one.sd - 0.15 * one.mean) < 1e-9,
  one.sd + " vs " + 0.15 * one.mean,
);
var pooled = Engine.workStats(CASE, ["O1"], Engine.allProducts(CASE), 0, 1);
var sumOfSd = Engine.allProducts(CASE).reduce(function (a, p) {
  return a + Engine.workStats(CASE, ["O1"], [p], 0, 1).sd;
}, 0);
ok(
  "pooling independent products shrinks the relative spread",
  pooled.sd < sumOfSd,
  pooled.sd + " vs " + sumOfSd,
);

// 15. Erlang C behaves
ok("no wait when nothing is offered", Engine.erlangC(3, 0) === 0);
ok(
  "certain wait when offered load reaches the servers",
  Engine.erlangC(3, 3) === 1,
);
ok(
  "more servers wait less at the same utilization",
  Engine.erlangC(5, 4.5) < Engine.erlangC(1, 0.9),
);
ok(
  "erlang C is a probability",
  [0.1, 1, 2.5, 4.9].every(function (a) {
    var v = Engine.erlangC(5, a);
    return v >= 0 && v <= 1;
  }),
);

// 16. queues: splitting a pool costs waiting, not capital
var fn = Engine.evaluate(CASE, "function", 0, 0);
var holo = Engine.evaluate(CASE, "holographic", 0, 0);
ok(
  "holographic holds the same machines as function",
  holo.processors === fn.processors,
  holo.processors + " vs " + fn.processors,
);
ok(
  "holographic runs them at the same utilization",
  Math.abs(holo.utilization - fn.utilization) < 1e-9,
);
ok(
  "holographic waits longer than function",
  holo.avgWait > fn.avgWait,
  holo.avgWait + " vs " + fn.avgWait,
);
ok(
  "no station is loaded beyond its machines",
  Engine.ORGANIZATIONS.every(function (o) {
    return Engine.evaluate(CASE, o.id, 0, 0).centres.every(function (c) {
      return c.stations.every(function (s) {
        return s.utilization <= 1 + 1e-9;
      });
    });
  }),
);
ok(
  "every wait is finite",
  Engine.ORGANIZATIONS.every(function (o) {
    return isFinite(Engine.evaluate(CASE, o.id, 0, 0).avgWait);
  }),
);

// 17. flows: work either crosses between centres or stays inside one
var totalVisits = CASE.products.reduce(function (a, p) {
  return a + Engine.demandOf(CASE, p.id, 0) * (p.route.length - 1);
}, 0);
Engine.ORGANIZATIONS.forEach(function (o) {
  var r = Engine.evaluate(CASE, o.id, 0, 0);
  ok(
    "moves and internal handling account for every step in " + o.id,
    Math.abs(r.flows.moves + r.flows.inside - totalVisits) < 1e-6,
    r.flows.moves + " + " + r.flows.inside + " vs " + totalVisits,
  );
  ok(
    "no arc leaves a centre for itself in " + o.id,
    r.flows.arcs.every(function (a) {
      return a.from !== a.to;
    }),
  );
  var ids = r.centres
    .map(function (c) {
      return c.id;
    })
    .concat(["IN", "OUT"]);
  ok(
    "every arc joins centres that exist in " + o.id,
    r.flows.arcs.every(function (a) {
      return ids.indexOf(a.from) >= 0 && ids.indexOf(a.to) >= 0;
    }),
  );
});
var prod = Engine.evaluate(CASE, "product", 0, 0);
ok(
  "a product organization moves nothing between centres",
  prod.flows.moves === 0,
);
ok(
  "a function organization moves everything between centres",
  Math.abs(fn.flows.moves - totalVisits) < 1e-6,
);

// 18. the years
var line = Engine.timeline(CASE, "product", 0);
ok("one entry per period", line.years.length === CASE.periods.length);
ok(
  "one step between each pair of years",
  line.steps.length === CASE.periods.length - 1,
);
ok("P5 retires after Year 3", Engine.demandOf(CASE, "P5", 3) === 0);
ok(
  "its centre closes with it",
  line.years[3].result.centres.every(function (c) {
    return c.id !== "P5";
  }),
);
ok(
  "closing a centre frees machines",
  line.steps[2].removed > 0,
  "" + line.steps[2].removed,
);
ok(
  "freed machines are moved rather than bought where the operation matches",
  line.steps[2].moved > 0,
  "" + line.steps[2].moved,
);
ok(
  "a move costs less than a purchase",
  CASE.money.relocate < CASE.money.install,
);
Engine.ORGANIZATIONS.forEach(function (o) {
  var L = Engine.timeline(CASE, o.id, 0);
  ok(
    "costs add up in " + o.id,
    Math.abs(L.totalCost - (L.initialCost + L.changeCost)) < 1e-6,
  );
  ok(
    "never moves more than it adds in " + o.id,
    L.steps.every(function (s) {
      return s.moved <= s.added + 1e-9 && s.moved <= s.removed + 1e-9;
    }),
  );
  ok(
    "bought and moved make up what was added in " + o.id,
    L.steps.every(function (s) {
      return Math.abs(s.bought + s.moved - s.added) < 1e-6;
    }),
  );
  ok(
    "year 1 of the timeline matches a direct evaluation in " + o.id,
    L.years[0].result.processors ===
      Engine.evaluate(CASE, o.id, 0, 0).processors,
  );
});

// 19. the calibration is pinned to Year 1 at the mean, whatever the page shows
ok(
  "calibration ignores the chosen year and service level",
  Engine.calibration(CASE).computedTotal === 27,
);

console.log(
  (fails ? "FAILED " : "OK ") + (checks - fails) + "/" + checks + " checks",
);
process.exit(fails ? 1 : 0);
