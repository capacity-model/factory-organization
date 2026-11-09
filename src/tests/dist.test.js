var fs = require("fs"),
  path = require("path");
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
var html = fs.readFileSync(path.join(dir, "..", "index.html"), "utf8");
var fails = 0,
  checks = 0;
function ok(n, c, e) {
  checks++;
  if (!c) {
    fails++;
    console.log("  FAIL " + n + (e ? "  " + e : ""));
  }
}

ok("no external script tags left", !/<script src=/.test(html));
ok("no external stylesheet link", !/<link[^>]+stylesheet/.test(html));
ok("single file carries the engine", /Engine = \(function/.test(html));
ok("single file carries the case", /CASE = \{/.test(html));
ok(
  "single file carries the page code",
  /Factory Organization Designer — the page/.test(html),
);

var dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
});
var w = dom.window;

w.document.addEventListener("DOMContentLoaded", function () {
  // let the page's own listener run first
  setTimeout(function () {
    var t = w.document.body.textContent;
    var q = function (s) {
      return w.document.querySelectorAll(s);
    };
    ok(
      "dist renders the tabs",
      q("#tabs .tab").length === 4,
      "" + q("#tabs .tab").length,
    );
    ok(
      "dist renders the green banner",
      !!w.document.querySelector(".banner-ok"),
    );
    ok("dist reports 27 processors", /27 processors/.test(t));
    ok(
      "dist draws eight centres",
      q(".centre").length === 8,
      "" + q(".centre").length,
    );
    ok(
      "dist sums to 27 machines",
      Array.prototype.slice.call(q(".centre-n")).reduce(function (a, n) {
        return a + parseInt(n.textContent, 10);
      }, 0) === 27,
    );
    console.log(
      (fails ? "FAILED " : "OK ") + (checks - fails) + "/" + checks + " checks",
    );
    process.exit(fails ? 1 : 0);
  }, 0);
});

setTimeout(function () {
  console.log("FAILED the page never finished loading");
  process.exit(1);
}, 8000);
