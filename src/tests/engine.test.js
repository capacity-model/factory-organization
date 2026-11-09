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
ok("one period in version 1", CASE.periods.length === 1);

console.log(
  (fails ? "FAILED " : "OK ") + (checks - fails) + "/" + checks + " checks",
);
process.exit(fails ? 1 : 0);
