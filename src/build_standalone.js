/* Inlines case.js, engine.js and app.js into the published index.html at the
 * project root, so the tool is one file that opens from disk, and from GitHub
 * Pages, with no server and no dependencies. */
var fs = require("fs");
var path = require("path");

var dir = __dirname;
var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
var out = path.join(dir, "..", "index.html");

["case.js", "engine.js", "app.js"].forEach(function (f) {
  var tag = '<script src="' + f + '"></script>';
  if (html.indexOf(tag) < 0) throw new Error("tag not found for " + f);
  var src = fs.readFileSync(path.join(dir, f), "utf8");
  html = html.replace(tag, "<script>\n" + src + "\n</script>");
});

if (/<script src=/.test(html)) throw new Error("a script tag was left behind");
fs.writeFileSync(out, html);
console.log("index.html written, " + (html.length / 1024).toFixed(1) + " KB");
