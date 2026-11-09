var fs = require("fs");
var path = require("path");
var dir = path.join(__dirname, "..");
var JSDOM = require(
  path.join(
    dir,
    "..",
    "..",
    "layout_designer",
    "tests",
    "node_modules",
    "jsdom",
  ),
).JSDOM;

var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
var dom = new JSDOM(html, {
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
var w = dom.window;
["case.js", "engine.js", "app.js"].forEach(function (f) {
  w.eval(fs.readFileSync(path.join(dir, f), "utf8"));
});
w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));

var fails = 0,
  checks = 0;
function ok(name, cond, extra) {
  checks++;
  if (!cond) {
    fails++;
    console.log("  FAIL " + name + (extra ? "  " + extra : ""));
  }
}
function $(s) {
  return w.document.querySelector(s);
}
function all(s) {
  return Array.prototype.slice.call(w.document.querySelectorAll(s));
}
function text() {
  return w.document.body.textContent;
}
function click(node) {
  node.dispatchEvent(new w.Event("click", { bubbles: true }));
}

// the shell came up
ok(
  "four tabs rendered",
  all("#tabs .tab").length === 4,
  "" + all("#tabs .tab").length,
);
ok(
  "capacity tab is the one open",
  $("#tabs .tab-on").textContent === "Capacity",
);
ok("body is not empty", $("#body").children.length > 0);

// the calibration banner is green and names the right total
ok("banner is green", !!$(".banner-ok"));
ok("banner reports 27", /27 processors/.test(text()));
ok(
  "one chip per operation",
  all(".chip").length === 8,
  "" + all(".chip").length,
);
ok("every chip is ok", all(".chip-off").length === 0);

// the capacity tab shows the function organization by default
ok(
  "function is the selected organization",
  $(".pick-on").textContent === "Function",
);
ok(
  "eight function centres drawn",
  all(".centre").length === 8,
  "" + all(".centre").length,
);
var machines = all(".centre-n").map(function (n) {
  return parseInt(n.textContent, 10);
});
ok(
  "centres sum to 27",
  machines.reduce(function (a, b) {
    return a + b;
  }, 0) === 27,
  JSON.stringify(machines),
);
ok("utilization bars drawn", all(".bar-fill").length >= 8);

// switching organization changes the picture
var picks = all(".pick");
var product = picks.filter(function (p) {
  return p.textContent === "Product";
})[0];
ok("a Product button exists", !!product);
click(product);
ok("product organization selected", $(".pick-on").textContent === "Product");
ok(
  "seven product centres",
  all(".centre").length === 7,
  "" + all(".centre").length,
);
var m2 = all(".centre-n").map(function (n) {
  return parseInt(n.textContent, 10);
});
ok(
  "product centres sum to 39",
  m2.reduce(function (a, b) {
    return a + b;
  }, 0) === 39,
  JSON.stringify(m2),
);
ok(
  "product organization shows an idle machine",
  all(".bar-low").length > 0,
  "no bar under a third",
);

// the compare tab lists every organization with its machine count
var tabs = all("#tabs .tab");
click(
  tabs.filter(function (t) {
    return /Compare/.test(t.textContent);
  })[0],
);
ok(
  "compare table has a row per organization",
  all(".big tr").length === 7,
  "" + all(".big tr").length,
);
ok("compare names the function count", /\b27\b/.test(text()));
ok("compare names the product count", /\b39\b/.test(text()));
ok(
  "compare explains the invariant",
  /work to be done never changes/i.test(text()),
);

// the case tab is editable and drives the rest
click(
  all("#tabs .tab").filter(function (t) {
    return /The case/.test(t.textContent);
  })[0],
);
ok(
  "seven demand inputs",
  all("input.dem").length === 7,
  "" + all("input.dem").length,
);
ok(
  "routes drawn as steps",
  all(".step").length === 39,
  "" + all(".step").length,
);
ok("legend lists eight operations", all(".leg").length === 8);

var first = all("input.dem")[0];
ok("first demand is 450", first.value === "450", first.value);
first.value = "900";
first.dispatchEvent(new w.Event("change", { bubbles: true }));
ok("editing demand re-renders", all("input.dem")[0].value === "900");
click(
  all("#tabs .tab").filter(function (t) {
    return /Capacity/.test(t.textContent);
  })[0],
);
ok(
  "banner goes amber when the case drifts",
  !!$(".banner-off"),
  "banner stayed green after doubling P1 demand",
);
ok(
  "amber banner says it no longer matches",
  /no longer matches slide 19/.test(text()),
);

// put it back and the banner returns to green
click(
  all("#tabs .tab").filter(function (t) {
    return /The case/.test(t.textContent);
  })[0],
);
var back = all("input.dem")[0];
back.value = "450";
back.dispatchEvent(new w.Event("change", { bubbles: true }));
click(
  all("#tabs .tab").filter(function (t) {
    return /Capacity/.test(t.textContent);
  })[0],
);
ok("banner returns to green", !!$(".banner-ok"));

// the scope tab states plainly what is and is not modelled
click(
  all("#tabs .tab").filter(function (t) {
    return /Scope/.test(t.textContent);
  })[0],
);
ok("scope tab lists what is missing", /Not here yet/.test(text()));
ok("scope tab carries the open questions", /Open questions/.test(text()));
ok("scope mentions multi-period is not done", /Several periods/.test(text()));

console.log(
  (fails ? "FAILED " : "OK ") + (checks - fails) + "/" + checks + " checks",
);
process.exit(fails ? 1 : 0);
