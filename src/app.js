/* Factory Organization Designer — the page */

(function () {
  var state = { tab: "capacity", org: "function", period: 0 };

  function $(sel) {
    return document.querySelector(sel);
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      if (c) n.appendChild(c);
    });
    return n;
  }
  function pct(x) {
    return (x * 100).toFixed(0) + "%";
  }
  function num(x, d) {
    return x.toFixed(d === undefined ? 1 : d);
  }

  function opInfo(id) {
    return CASE.operations.filter(function (o) {
      return o.id === id;
    })[0];
  }

  /* a small coloured glyph standing in for the shape he draws on the slides */
  function glyph(opId, size) {
    var o = opInfo(opId);
    var s = size || 14;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", s);
    svg.setAttribute("height", s);
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("class", "glyph");
    var sh;
    if (o.shape === "circle") {
      sh = document.createElementNS(ns, "circle");
      sh.setAttribute("cx", 10);
      sh.setAttribute("cy", 10);
      sh.setAttribute("r", 7);
    } else if (o.shape === "ellipse") {
      sh = document.createElementNS(ns, "ellipse");
      sh.setAttribute("cx", 10);
      sh.setAttribute("cy", 10);
      sh.setAttribute("rx", 9);
      sh.setAttribute("ry", 5.5);
    } else if (o.shape === "rect") {
      sh = document.createElementNS(ns, "rect");
      sh.setAttribute("x", 2);
      sh.setAttribute("y", 5);
      sh.setAttribute("width", 16);
      sh.setAttribute("height", 10);
      sh.setAttribute("rx", 1.5);
    } else if (o.shape === "para") {
      sh = document.createElementNS(ns, "polygon");
      sh.setAttribute("points", "5,5 19,5 15,15 1,15");
    } else if (o.shape === "trap") {
      sh = document.createElementNS(ns, "polygon");
      sh.setAttribute("points", "3,5 17,5 14,15 6,15");
    } else if (o.shape === "hex") {
      sh = document.createElementNS(ns, "polygon");
      sh.setAttribute("points", "10,2 17,6 17,14 10,18 3,14 3,6");
    } else {
      sh = document.createElementNS(ns, "polygon");
      sh.setAttribute(
        "points",
        "7,3 13,3 13,7 17,7 17,13 13,13 13,17 7,17 7,13 3,13 3,7 7,7",
      );
    }
    sh.setAttribute("fill", o.fill);
    sh.setAttribute("stroke", "rgba(0,0,0,.35)");
    sh.setAttribute("stroke-width", 1);
    svg.appendChild(sh);
    return svg;
  }

  function opLabel(opId) {
    return el("span", { class: "oplab" }, [
      glyph(opId),
      el("span", { text: opId }),
    ]);
  }

  /* ---------------- banner: does it reproduce his slide? ---------------- */

  function calibrationBanner() {
    var cal = Engine.calibration(CASE, state.period);
    var box = el("div", {
      class: "banner " + (cal.ok ? "banner-ok" : "banner-off"),
    });
    box.appendChild(
      el("div", {
        class: "banner-head",
        text: cal.ok
          ? "Function organization reproduces slide 19: " +
            cal.computedTotal +
            " processors, every centre matching"
          : "Function organization no longer matches slide 19 (" +
            cal.computedTotal +
            " against " +
            cal.drawnTotal +
            " drawn)",
      }),
    );
    var row = el("div", { class: "chips" });
    cal.rows.forEach(function (r) {
      row.appendChild(
        el("span", { class: "chip " + (r.ok ? "chip-ok" : "chip-off") }, [
          glyph(r.op),
          el("b", { text: String(r.computed) }),
          el("span", {
            class: "chip-sub",
            text: r.ok ? "drawn " + r.drawn : "drawn " + r.drawn + " ✕",
          }),
        ]),
      );
    });
    box.appendChild(row);
    box.appendChild(
      el("p", {
        class: "note",
        text:
          "Demand and operation times are synthetic. They were fitted until this row matched the " +
          "processors Prof. Montreuil draws on slide 19, so every number the tool shows rests on " +
          "the case as taught. Change a demand or a time and this banner tells you at once whether " +
          "the case still reconciles.",
      }),
    );
    return box;
  }

  /* ---------------- tab: capacity ---------------- */

  function utilBar(u) {
    var cls = u < 0.35 ? "bar-low" : u < 0.7 ? "bar-mid" : "bar-high";
    return el("span", { class: "bar" }, [
      el("span", { class: "bar-fill " + cls, style: "width:" + pct(u) }),
      el("span", { class: "bar-text", text: pct(u) }),
    ]);
  }

  function capacityTab() {
    var wrap = el("div", {});
    wrap.appendChild(calibrationBanner());

    var picker = el("div", { class: "picker" });
    Engine.ORGANIZATIONS.forEach(function (o) {
      picker.appendChild(
        el("button", {
          class: "pick " + (state.org === o.id ? "pick-on" : ""),
          text: o.name.replace(" organization", ""),
          onclick: function () {
            state.org = o.id;
            render();
          },
        }),
      );
    });
    wrap.appendChild(picker);

    var r = Engine.evaluate(CASE, state.org, state.period);
    wrap.appendChild(el("p", { class: "blurb", text: r.org.blurb }));

    var stats = el("div", { class: "stats" });
    [
      ["Centres", String(r.centreCount)],
      ["Processors", String(r.processors)],
      ["Work to be done", num(r.theoretical, 2) + " processors"],
      ["Bought for rounding", "+" + num(r.rounding, 2)],
      ["Average utilization", pct(r.utilization)],
    ].forEach(function (s) {
      stats.appendChild(
        el("div", { class: "stat" }, [
          el("div", { class: "stat-k", text: s[0] }),
          el("div", { class: "stat-v", text: s[1] }),
        ]),
      );
    });
    wrap.appendChild(stats);

    var grid = el("div", { class: "centres" });
    r.centres.forEach(function (c) {
      var card = el("div", { class: "centre" });
      card.appendChild(
        el("div", { class: "centre-head" }, [
          el("span", { class: "centre-id", text: c.id }),
          el("span", {
            class: "centre-n",
            text:
              c.processors + (c.processors === 1 ? " machine" : " machines"),
          }),
        ]),
      );
      var tb = el("table", { class: "mini" });
      c.stations.forEach(function (s) {
        var ops = el("span", { class: "oplab" });
        s.ops.forEach(function (o) {
          ops.appendChild(glyph(o));
        });
        ops.appendChild(el("span", { text: " " + s.label }));
        tb.appendChild(
          el("tr", {}, [
            el("td", { class: "l" }, [ops]),
            el("td", { class: "r", text: String(s.processors) }),
            el("td", { class: "r wide" }, [utilBar(s.utilization)]),
          ]),
        );
      });
      card.appendChild(tb);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);

    wrap.appendChild(
      el("p", {
        class: "note",
        text:
          "A bar under about a third is the picture he shows in class: a machine standing idle " +
          "most of the period because the centre it sits in is too small to keep it busy.",
      }),
    );
    return wrap;
  }

  /* ---------------- tab: compare ---------------- */

  function compareTab() {
    var wrap = el("div", {});
    wrap.appendChild(calibrationBanner());

    var rows = Engine.ORGANIZATIONS.map(function (o) {
      return Engine.evaluate(CASE, o.id, state.period);
    });
    var most = Math.max.apply(
      null,
      rows.map(function (r) {
        return r.processors;
      }),
    );

    var t = el("table", { class: "big" });
    t.appendChild(
      el("tr", {}, [
        el("th", { class: "l", text: "Organization" }),
        el("th", { class: "r", text: "Centres" }),
        el("th", { class: "r", text: "Machines" }),
        el("th", { class: "r", text: "Bought for rounding" }),
        el("th", { class: "r", text: "Average utilization" }),
        el("th", { class: "l", text: "" }),
      ]),
    );
    rows.forEach(function (r) {
      var cell = el("td", { class: "l wide" });
      cell.appendChild(
        el("span", { class: "bar bar-wide" }, [
          el("span", {
            class: "bar-fill bar-count",
            style: "width:" + pct(r.processors / most),
          }),
        ]),
      );
      t.appendChild(
        el(
          "tr",
          { class: r.org.id === state.org ? "row-on" : "" },
          [
            el("td", { class: "l", text: r.org.name }),
            el("td", { class: "r", text: String(r.centreCount) }),
            el("td", { class: "r strong", text: String(r.processors) }),
            el("td", { class: "r", text: "+" + num(r.rounding, 2) }),
            el("td", { class: "r", text: pct(r.utilization) }),
            cell,
          ].filter(Boolean),
        ),
      );
    });
    wrap.appendChild(t);

    var f = rows.filter(function (r) {
      return r.org.id === "function";
    })[0];
    var p = rows.filter(function (r) {
      return r.org.id === "product";
    })[0];
    wrap.appendChild(
      el("div", { class: "insight" }, [
        el("h3", { text: "What the column is showing" }),
        el("p", {
          text:
            "The work to be done never changes: " +
            num(f.theoretical, 2) +
            " processors' worth, whichever way the factory is cut. What changes is how many times " +
            "that work is divided before each piece is rounded up to a whole machine.",
        }),
        el("p", {
          text:
            "The function organization pools every product's demand for an operation into one " +
            "centre and rounds up once per operation: " +
            f.processors +
            " machines. The product organization gives each product its own centre and rounds up " +
            "inside every one of them: " +
            p.processors +
            " machines, " +
            (p.processors - f.processors) +
            " more for exactly the same output.",
        }),
        el("p", {
          text:
            "Those extra machines are what a product organization pays for short travel and clear " +
            "ownership. Version 1 prices only one side of that trade, which is the first thing to " +
            "extend.",
        }),
      ]),
    );
    return wrap;
  }

  /* ---------------- tab: case ---------------- */

  function caseTab() {
    var wrap = el("div", {});
    wrap.appendChild(
      el("div", { class: "insight" }, [
        el("h3", { text: "Where this case comes from" }),
        el("p", {
          text:
            "The seven products and their routings are read off slide 3 of Supply Chain Facility " +
            "Organization Design Fundamentals, version 2025/10/14, after Montreuil & Lefrancois " +
            "(1996). The equipment counts the tool is calibrated against are read off slide 19.",
        }),
        el("p", {
          text:
            "A period is one " +
            CASE.period.hours +
            "-hour workday at " +
            pct(CASE.period.efficiency) +
            " processor efficiency, the convention slide 64 uses, so one processor offers " +
            Engine.availableMinutes(CASE) +
            " minutes of work per period.",
        }),
      ]),
    );

    var t = el("table", { class: "big" });
    var head = [
      el("th", { class: "l", text: "Product" }),
      el("th", { class: "r", text: "Demand / period" }),
      el("th", { class: "l", text: "Route, with minutes per unit" }),
    ];
    t.appendChild(el("tr", {}, head));

    CASE.products.forEach(function (p) {
      var route = el("span", { class: "route" });
      p.route.forEach(function (op, i) {
        if (i) route.appendChild(el("span", { class: "arrow", text: "→" }));
        route.appendChild(
          el("span", { class: "step" }, [
            glyph(op, 16),
            el("span", {
              class: "step-t",
              text: num(Engine.timeOf(CASE, op, p.id), 2),
            }),
          ]),
        );
      });
      var inp = el("input", {
        class: "dem",
        type: "number",
        min: "0",
        step: "10",
        value: String(p.demand[state.period]),
      });
      inp.addEventListener("change", function () {
        var v = Number(inp.value);
        if (isFinite(v) && v >= 0) {
          p.demand[state.period] = v;
          render();
        }
      });
      t.appendChild(
        el("tr", {}, [
          el("td", { class: "l strong", text: p.id }),
          el("td", { class: "r" }, [inp]),
          el("td", { class: "l" }, [route]),
        ]),
      );
    });
    wrap.appendChild(t);

    wrap.appendChild(
      el("p", {
        class: "note",
        text:
          "Change a demand and every tab recomputes. The banner at the top of the other tabs turns " +
          "amber as soon as the function organization stops reproducing slide 19, which is the " +
          "signal that the case has drifted away from the one he teaches.",
      }),
    );

    var legend = el("div", { class: "legend" });
    CASE.operations.forEach(function (o) {
      legend.appendChild(
        el("span", { class: "leg" }, [
          glyph(o.id, 16),
          el("span", { text: o.id + " · " + o.name }),
        ]),
      );
    });
    wrap.appendChild(el("h3", { class: "h3", text: "Operations" }));
    wrap.appendChild(legend);
    return wrap;
  }

  /* ---------------- tab: next ---------------- */

  function nextTab() {
    var wrap = el("div", {});
    function block(title, items, tone) {
      var b = el("div", { class: "insight " + (tone || "") });
      b.appendChild(el("h3", { text: title }));
      var ul = el("ul", {});
      items.forEach(function (i) {
        ul.appendChild(el("li", { text: i }));
      });
      b.appendChild(ul);
      return b;
    }
    wrap.appendChild(
      block("In this version", [
        "The seven-product case with its routings, demand and operation times, all editable.",
        "Required processors and utilization per centre, from demand and times alone.",
        "Six organizations: product, group, fractal, function, process, holographic.",
        "A standing check that the function organization still reproduces the counts on slide 19.",
        "Demand held per period in the data from the start, so years can be added without reworking the engine.",
      ]),
    );
    wrap.appendChild(
      block(
        "Not here yet",
        [
          "Several periods, and the cost of relayout between them.",
          "Demand as a distribution, and capacity sized for a stated robustness.",
          "Queues, waiting time and work in process between machines and between centres.",
          "Layout: equipment inside a centre, and centres inside the factory.",
          "Travel, flow and traffic between centres.",
          "Operators, floor space and cost.",
        ],
        "insight-soft",
      ),
    );
    wrap.appendChild(
      block(
        "Open questions",
        [
          "A composite centre is modelled with processors flexible across its operations, as on slide 67. That makes the process organization need 26 machines, one fewer than the function organization's 27 — so the function organization is the leanest only among dedicated-processor designs.",
          "Slide 66 prints TOTAL 46 while its own column A2 B1 C4 D7 E4 F1 G1 H9 I13 J1 sums to 43, and the drawing shows 43 processors. The missing three may be the MP/PF blocks.",
          "On slide 64 of the A-to-J case, operation I is drawn with 13 processors where the stated 86% utilization implies 12.",
          "Which organizations should the tool carry, and should the group and process centres be fixed or left for the user to form?",
        ],
        "insight-ask",
      ),
    );
    return wrap;
  }

  /* ---------------- shell ---------------- */

  var TABS = [
    ["capacity", "Capacity", capacityTab],
    ["compare", "Compare organizations", compareTab],
    ["case", "The case", caseTab],
    ["next", "Scope and questions", nextTab],
  ];

  function render() {
    var nav = $("#tabs");
    nav.innerHTML = "";
    TABS.forEach(function (t) {
      nav.appendChild(
        el("button", {
          class: "tab " + (state.tab === t[0] ? "tab-on" : ""),
          text: t[1],
          onclick: function () {
            state.tab = t[0];
            render();
          },
        }),
      );
    });
    var body = $("#body");
    body.innerHTML = "";
    TABS.forEach(function (t) {
      if (t[0] === state.tab) body.appendChild(t[2]());
    });
  }

  window.addEventListener("DOMContentLoaded", render);
})();
