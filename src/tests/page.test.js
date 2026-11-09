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
function click(n) {
  n.dispatchEvent(new w.Event("click", { bubbles: true }));
}
function tab(name) {
  var t = all("#tabs .tab").filter(function (x) {
    return new RegExp(name).test(x.textContent);
  })[0];
  ok("tab exists: " + name, !!t);
  if (t) click(t);
}
function pick(name) {
  var p = all(".pick").filter(function (x) {
    return x.textContent === name;
  })[0];
  ok("organization button exists: " + name, !!p);
  if (p) click(p);
}
function machines() {
  return all(".centre-n").reduce(function (a, n) {
    return a + parseInt(n.textContent, 10);
  }, 0);
}

/* ---- the shell ---- */
ok(
  "seven tabs rendered",
  all("#tabs .tab").length === 7,
  "" + all("#tabs .tab").length,
);
ok("capacity is the tab open", $("#tabs .tab-on").textContent === "Capacity");
ok("body is not empty", $("#body").children.length > 0);

/* ---- the standing reconciliation ---- */
ok("banner is green", !!$(".banner-ok"));
ok("banner reports 27", /27 processors/.test(text()));
ok(
  "one chip per operation",
  all(".chip").length === 8,
  "" + all(".chip").length,
);
ok("every chip matches", all(".chip-off").length === 0);

/* ---- capacity, at Year 1 on the mean ---- */
ok(
  "function is the organization shown",
  $(".pick-on").textContent === "Function",
);
ok(
  "eight function centres",
  all(".centre").length === 8,
  "" + all(".centre").length,
);
ok("they sum to 27 machines", machines() === 27, "" + machines());
ok("utilization bars drawn", all(".bar-fill").length >= 8);
ok("a queue is reported per station", all(".queue").length >= 8);
ok("the average wait is a headline", /Average wait per visit/.test(text()));
ok("moves between centres is a headline", /Moves between centres/.test(text()));

/* ---- the year and service-level controls ---- */
ok(
  "four years and four service levels",
  all(".mini-pick").length === 8,
  "" + all(".mini-pick").length,
);
ok(
  "Year 1 is selected",
  all(".mini-pick")[0].className.indexOf("mini-on") >= 0,
);
ok(
  "the mean is selected",
  all(".mini-pick")[4].className.indexOf("mini-on") >= 0,
);

click(all(".mini-pick")[6]); // 95%
var at95 = machines();
ok("95% robustness buys machines", at95 > 27, at95 + " vs 27");
ok(
  "the banner stays green at 95%",
  !!$(".banner-ok"),
  "the reconciliation is read on Year 1 at the mean, not on the chosen level",
);
click(all(".mini-pick")[4]); // mean
ok("back to 27 at the mean", machines() === 27, "" + machines());

click(all(".mini-pick")[3]); // Year 4
ok("Year 4 differs from Year 1", machines() !== 27, "" + machines());
ok("the banner is still green in Year 4", !!$(".banner-ok"));
click(all(".mini-pick")[0]); // Year 1
ok("back to 27 in Year 1", machines() === 27, "" + machines());

/* ---- switching organization ---- */
pick("Product");
ok("product organization selected", $(".pick-on").textContent === "Product");
ok(
  "seven product centres",
  all(".centre").length === 7,
  "" + all(".centre").length,
);
ok("product centres sum to 39", machines() === 39, "" + machines());
ok("a product organization shows an idle machine", all(".bar-low").length > 0);
pick("Holographic");
ok(
  "holographic draws 27 centres",
  all(".centre").length === 27,
  "" + all(".centre").length,
);
ok("each holding one machine", machines() === 27, "" + machines());
pick("Function");

/* ---- network ---- */
tab("Network");
ok("the diagram is drawn", !!$("svg.net"));
ok(
  "a node per centre plus IN and OUT",
  $("svg.net").querySelectorAll("circle").length === 8 + 2,
  "" + $("svg.net").querySelectorAll("circle").length,
);
ok("arcs drawn", $("svg.net").querySelectorAll("path").length > 8);
ok("arcs carry a tooltip", !!$("svg.net title"));
ok("the heaviest arcs are tabulated", /Heaviest arcs/.test(text()));
pick("Product");
ok(
  "a product organization reports no arcs between centres",
  /No arcs between centres/.test(text()),
);
ok(
  "and still draws its centres",
  $("svg.net").querySelectorAll("circle").length === 7 + 2,
  "" + $("svg.net").querySelectorAll("circle").length,
);
pick("Function");

/* ---- over the years ---- */
tab("Over the years");
ok("a row per organization and a header", all(".big tr").length >= 7);
ok(
  "exactly one best row is marked",
  all(".row-best").length === 1,
  "" + all(".row-best").length,
);
ok("a year-on-year breakdown", /Moved, not bought/.test(text()));
ok("money is shown", /\$/.test(text()));
ok("the composition point is made", /change in its composition/.test(text()));
ok("the prices are flagged as placeholders", /placeholders/.test(text()));

/* ---- compare ---- */
tab("Compare");
ok(
  "compare has a row per organization",
  all(".big tr").length === 7,
  "" + all(".big tr").length,
);
ok("compare names the function count", /\b27\b/.test(text()));
ok("compare names the product count", /\b39\b/.test(text()));
ok(
  "compare explains the invariant",
  /work to be done never changes/i.test(text()),
);
ok(
  "compare makes the holographic point",
  /Breaking one pool of machines/.test(text()),
);

/* ---- the case ---- */
tab("The case");
ok(
  "a demand box per product per year, plus a CoV box",
  all("input.dem").length === 7 * 4 + 7,
  "" + all("input.dem").length,
);
ok(
  "routes drawn as steps",
  all(".step").length === 39,
  "" + all(".step").length,
);
ok("a robustness table", /What robustness costs/.test(text()));
ok("legend lists eight operations", all(".leg").length === 8);

/* editing Year 1 demand breaks the reconciliation, and putting it back mends it */
var first = all("input.dem")[0];
ok("the first box is P1 in Year 1", first.value === "450", first.value);
first.value = "900";
first.dispatchEvent(new w.Event("change", { bubbles: true }));
ok("the edit sticks", all("input.dem")[0].value === "900");
tab("Capacity");
ok("the banner turns amber", !!$(".banner-off"));
ok(
  "and says Year 1 no longer reproduces slide 19",
  /no longer reproduces slide 19/.test(text()),
);
tab("The case");
var back = all("input.dem")[0];
back.value = "450";
back.dispatchEvent(new w.Event("change", { bubbles: true }));
tab("Capacity");
ok("the banner returns to green", !!$(".banner-ok"));
ok("and the machines return to 27", machines() === 27, "" + machines());

/* editing a later year must not disturb the reconciliation */
tab("The case");
var y4 = all("input.dem")[3];
y4.value = "1200";
y4.dispatchEvent(new w.Event("change", { bubbles: true }));
tab("Capacity");
ok("a Year 4 edit leaves the banner green", !!$(".banner-ok"));
tab("The case");
all("input.dem")[3].value = "690";
all("input.dem")[3].dispatchEvent(new w.Event("change", { bubbles: true }));

/* ---- scope ---- */
tab("Scope and questions");
ok("scope lists what is here", /In this version/.test(text()));
ok("scope lists what is missing", /Not here yet/.test(text()));
ok("scope carries the open questions", /Open questions/.test(text()));
ok(
  "scope mentions layout is not done",
  /Layout: equipment inside a centre/.test(text()),
);
ok("scope mentions the queue model", /Erlang C/.test(text()));

/* ---- layout ---- */
tab("Layout");
ok("a plan is drawn", !!$("svg.plan"));
ok(
  "the building outline plus a block per centre",
  $("svg.plan").querySelectorAll("rect").length >= 1 + 8,
  "" + $("svg.plan").querySelectorAll("rect").length,
);
ok(
  "IN and OUT docks drawn",
  $("svg.plan").querySelectorAll("circle").length === 2,
  "" + $("svg.plan").querySelectorAll("circle").length,
);
ok("floor area is reported", /Building/.test(text()));
ok("travel is reported", /Travel per period/.test(text()));
ok("the two levels are explained", /The two levels/.test(text()));
ok(
  "footprints are flagged as an assumption",
  /Machine footprints are an assumption/.test(text()),
);
pick("Product");
ok("a product organization still draws a plan", !!$("svg.plan"));
ok(
  "and reports no travel between centres",
  /Of that between centres/.test(text()),
);
pick("Function");

/* travel reaches the comparison */
tab("Compare");
ok("compare carries travel", /Travel/.test(text()));
ok("compare carries floor", /Floor/.test(text()));
ok("compare closes the account", /the account closes/.test(text()));

console.log(
  (fails ? "FAILED " : "OK ") + (checks - fails) + "/" + checks + " checks",
);
process.exit(fails ? 1 : 0);
