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
ok("scope mentions the queue model", /Erlang C/.test(text()));
ok(
  "scope says what the numbers rest on",
  /What the numbers rest on/.test(text()),
);
ok(
  "scope no longer carries questions for the professor",
  !/Open questions/.test(text()),
);
ok(
  "scope no longer claims layout is missing",
  !/Layout: equipment inside a centre/.test(text()),
);
ok(
  "scope no longer claims travel is missing",
  !/Travel distance and traffic/.test(text()),
);
ok(
  "scope no longer claims the groups are fixed",
  !/Letting the user form the groups/.test(text()),
);
ok(
  "scope lists the two levels of layout as done",
  /Two levels of layout/.test(text()),
);
ok("scope lists the saved case as done", /saved to a file/.test(text()));
ok(
  "scope is honest about the footprints",
  /rest on judgement alone/.test(text()),
);

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

/* ---- waiting quantities, in his words as well as waiting time ---- */
tab("Capacity");
ok(
  "two queue columns per station",
  all(".queue").length >= 16,
  "" + all(".queue").length,
);
ok("parts waiting is a headline", /Parts waiting at any moment/.test(text()));
tab("Compare");
ok("compare carries parts waiting", /Parts waiting/.test(text()));

/* ---- the fractal centre count is adjustable ---- */
tab("Capacity");
pick("Fractal");
ok(
  "a centre-count control appears for the fractal organization",
  all(".inline-ctl").length === 1,
  "" + all(".inline-ctl").length,
);
var f3 = all(".centre").length;
ok("three fractal centres by default", f3 === 3, "" + f3);
var fourBtn = all(".inline-ctl .mini-pick").filter(function (b) {
  return b.textContent === "4";
})[0];
ok("a button for four centres", !!fourBtn);
click(fourBtn);
ok(
  "four fractal centres now",
  all(".centre").length === 4,
  "" + all(".centre").length,
);
ok("more centres need more machines", machines() > 33, "" + machines());
click(
  all(".inline-ctl .mini-pick").filter(function (b) {
    return b.textContent === "3";
  })[0],
);
ok("back to three", all(".centre").length === 3);
pick("Function");
ok(
  "the control is hidden for other organizations",
  all(".inline-ctl").length === 0,
);

/* ---- process times are editable ---- */
tab("The case");
ok(
  "a time box for every step",
  all("input.step-in").length === 39,
  "" + all("input.step-in").length,
);
var t0 = all("input.step-in")[0];
var was = t0.value;
t0.value = "5";
t0.dispatchEvent(new w.Event("change", { bubbles: true }));
tab("Capacity");
ok("a longer time breaks the reconciliation", !!$(".banner-off"));
tab("The case");
all("input.step-in")[0].value = was;
all("input.step-in")[0].dispatchEvent(new w.Event("change", { bubbles: true }));
tab("Capacity");
ok("restoring it mends the reconciliation", !!$(".banner-ok"));
ok("and the machines are back to 27", machines() === 27, "" + machines());

/* ---- groups and composite centres are editable ---- */
tab("The case");
ok(
  "a field per group and per composite centre",
  all("input.text").length === 6,
  "" + all("input.text").length,
);
ok(
  "the cover of the groups is reported",
  /every product is in exactly one group/.test(text()),
);
ok(
  "the cover of the composite centres is reported",
  /every operation is in a centre/.test(text()),
);
var g0 = all("input.text")[0];
var gWas = g0.value;
g0.value = "P1";
g0.dispatchEvent(new w.Event("change", { bubbles: true }));
ok("dropping products from a group is caught", /not in any group/.test(text()));
all("input.text")[0].value = gWas;
all("input.text")[0].dispatchEvent(new w.Event("change", { bubbles: true }));
ok(
  "restoring the group clears the warning",
  /every product is in exactly one group/.test(text()),
);

/* ---- a case can be carried away ---- */
ok(
  "save, load and reset buttons",
  all(".pick").filter(function (b) {
    return /Save this case|Load a case|Back to the lecture case/.test(
      b.textContent,
    );
  }).length === 3,
);
ok("a hidden file input", all("input.hidden-file").length === 1);

/* the reset button restores the lecture case after an edit */
var d0 = all("input.dem")[0];
d0.value = "1234";
d0.dispatchEvent(new w.Event("change", { bubbles: true }));
tab("Capacity");
ok("the edited case no longer reconciles", !!$(".banner-off"));
tab("The case");
click(
  all(".pick").filter(function (b) {
    return /Back to the lecture case/.test(b.textContent);
  })[0],
);
tab("Capacity");
ok("the reset button restores the lecture case", !!$(".banner-ok"));
ok("and its 27 machines", machines() === 27, "" + machines());

console.log(
  (fails ? "FAILED " : "OK ") + (checks - fails) + "/" + checks + " checks",
);
process.exit(fails ? 1 : 0);
