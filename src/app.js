/* Factory Organization Designer — the page */

(function () {
  var state = { tab: "capacity", org: "function", period: 0, sl: 0 };

  function $(s) {
    return document.querySelector(s);
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
  var NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      n.setAttribute(k, attrs[k]);
    });
    return n;
  }
  function pct(x) {
    return (x * 100).toFixed(0) + "%";
  }
  function num(x, d) {
    return x.toFixed(d === undefined ? 1 : d);
  }
  function qty(x) {
    return Math.round(x).toLocaleString("en-US");
  }
  function money(x) {
    var m = CASE.money.currency;
    if (Math.abs(x) >= 1e6) return m + (x / 1e6).toFixed(2) + "M";
    if (Math.abs(x) >= 1e3) return m + Math.round(x / 1e3) + "k";
    return m + Math.round(x);
  }
  function mins(x) {
    return isFinite(x) ? num(x, 1) + " min" : "unbounded";
  }
  function z() {
    return CASE.serviceLevels[state.sl].z;
  }
  function opInfo(id) {
    return CASE.operations.filter(function (o) {
      return o.id === id;
    })[0];
  }

  function glyph(opId, size) {
    var o = opInfo(opId);
    if (!o) return el("span", {});
    var s = size || 14;
    var g = svg("svg", {
      width: s,
      height: s,
      viewBox: "0 0 20 20",
      class: "glyph",
    });
    var sh;
    if (o.shape === "circle") sh = svg("circle", { cx: 10, cy: 10, r: 7 });
    else if (o.shape === "ellipse")
      sh = svg("ellipse", { cx: 10, cy: 10, rx: 9, ry: 5.5 });
    else if (o.shape === "rect")
      sh = svg("rect", { x: 2, y: 5, width: 16, height: 10, rx: 1.5 });
    else if (o.shape === "para")
      sh = svg("polygon", { points: "5,5 19,5 15,15 1,15" });
    else if (o.shape === "trap")
      sh = svg("polygon", { points: "3,5 17,5 14,15 6,15" });
    else if (o.shape === "hex")
      sh = svg("polygon", { points: "10,2 17,6 17,14 10,18 3,14 3,6" });
    else
      sh = svg("polygon", {
        points: "7,3 13,3 13,7 17,7 17,13 13,13 13,17 7,17 7,13 3,13 3,7 7,7",
      });
    sh.setAttribute("fill", o.fill);
    sh.setAttribute("stroke", "rgba(0,0,0,.35)");
    sh.setAttribute("stroke-width", 1);
    g.appendChild(sh);
    return g;
  }

  function utilBar(u) {
    var cls = u < 0.35 ? "bar-low" : u < 0.7 ? "bar-mid" : "bar-high";
    return el("span", { class: "bar" }, [
      el("span", {
        class: "bar-fill " + cls,
        style: "width:" + pct(Math.min(1, u)),
      }),
      el("span", { class: "bar-text", text: pct(u) }),
    ]);
  }

  /* ---------------- shared header controls ---------------- */

  function orgPicker(extra) {
    var box = el("div", { class: "picker" });
    Engine.ORGANIZATIONS.forEach(function (o) {
      box.appendChild(
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
    if (state.org === "fractal" && extra !== false) {
      var f = el("span", { class: "ctl inline-ctl" }, [
        el("span", { class: "ctl-k", text: "centres" }),
      ]);
      [2, 3, 4, 5].forEach(function (n) {
        f.appendChild(
          el("button", {
            class: "mini-pick " + (CASE.fractalCount === n ? "mini-on" : ""),
            text: String(n),
            onclick: function () {
              CASE.fractalCount = n;
              render();
            },
          }),
        );
      });
      box.appendChild(f);
    }
    return box;
  }

  function controls(opts) {
    var bar = el("div", { class: "controls" });
    if (opts.period !== false) {
      var p = el("span", { class: "ctl" }, [
        el("span", { class: "ctl-k", text: "Year" }),
      ]);
      CASE.periods.forEach(function (label, i) {
        p.appendChild(
          el("button", {
            class: "mini-pick " + (state.period === i ? "mini-on" : ""),
            text: label.replace("Year ", ""),
            onclick: function () {
              state.period = i;
              render();
            },
          }),
        );
      });
      bar.appendChild(p);
    }
    if (opts.sl !== false) {
      var s = el("span", { class: "ctl" }, [
        el("span", { class: "ctl-k", text: "Capacity sized for" }),
      ]);
      CASE.serviceLevels.forEach(function (sl, i) {
        s.appendChild(
          el("button", {
            class: "mini-pick " + (state.sl === i ? "mini-on" : ""),
            text: sl.label,
            onclick: function () {
              state.sl = i;
              render();
            },
          }),
        );
      });
      bar.appendChild(s);
    }
    return bar;
  }

  function calibrationBanner() {
    var cal = Engine.calibration(CASE);
    var box = el("div", {
      class: "banner " + (cal.ok ? "banner-ok" : "banner-off"),
    });
    box.appendChild(
      el("div", {
        class: "banner-head",
        text: cal.ok
          ? "Year 1 at the mean reproduces slide 19: " +
            cal.computedTotal +
            " processors, every centre matching"
          : "Year 1 no longer reproduces slide 19 (" +
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
    return box;
  }

  /* ---------------- tab: capacity ---------------- */

  function capacityTab() {
    var wrap = el("div", {});
    wrap.appendChild(calibrationBanner());
    wrap.appendChild(controls({}));

    wrap.appendChild(orgPicker());

    var r = Engine.evaluate(CASE, state.org, state.period, z());
    wrap.appendChild(el("p", { class: "blurb", text: r.org.blurb }));

    var stats = el("div", { class: "stats" });
    [
      ["Centres", String(r.centreCount)],
      ["Processors", String(r.processors)],
      ["Work to be done", num(r.theoretical, 2) + " processors"],
      ["Bought for rounding", "+" + num(r.rounding, 2)],
      ["Average utilization", pct(r.utilization)],
      ["Average wait per visit", mins(r.avgWait)],
      ["Parts waiting at any moment", num(r.waiting, 1)],
      ["Moves between centres", qty(r.flows.moves)],
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
            el("td", {
              class: "r queue",
              title: "mean wait before service",
              text: isFinite(s.queue.wait) ? num(s.queue.wait, 0) + "m" : "∞",
            }),
            el("td", {
              class: "r queue",
              title: "mean number of parts waiting",
              text: isFinite(s.queue.length) ? num(s.queue.length, 1) : "∞",
            }),
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
          "The last two columns are the mean wait before a part is served at that station and " +
          "the mean number of parts waiting in front of it, both from Erlang C on its offered load. " +
          "its offered load. A bar under about a third is the picture shown in class: a machine idle " +
          "most of the period because the centre it sits in is too small to keep it busy.",
      }),
    );
    return wrap;
  }

  /* ---------------- tab: network ---------------- */

  function networkTab() {
    var wrap = el("div", {});
    wrap.appendChild(controls({ sl: false }));

    wrap.appendChild(orgPicker());

    var r = Engine.evaluate(CASE, state.org, state.period, z());
    var f = r.flows;

    var stats = el("div", { class: "stats" });
    [
      ["Centres", String(r.centreCount)],
      ["Arcs between centres", String(f.betweenCentres.length)],
      ["Moves between centres", qty(f.moves)],
      ["Handled inside a centre", qty(f.inside)],
    ].forEach(function (s) {
      stats.appendChild(
        el("div", { class: "stat" }, [
          el("div", { class: "stat-k", text: s[0] }),
          el("div", { class: "stat-v", text: s[1] }),
        ]),
      );
    });
    wrap.appendChild(stats);
    wrap.appendChild(diagram(r));

    if (f.betweenCentres.length) {
      var t = el("table", { class: "big" });
      t.appendChild(
        el("tr", {}, [
          el("th", { class: "l", text: "From" }),
          el("th", { class: "l", text: "To" }),
          el("th", { class: "r", text: "Units per period" }),
          el("th", { class: "l", text: "Products" }),
        ]),
      );
      f.betweenCentres.slice(0, 18).forEach(function (a) {
        t.appendChild(
          el("tr", {}, [
            el("td", { class: "l", text: a.from }),
            el("td", { class: "l", text: a.to }),
            el("td", { class: "r strong", text: qty(a.units) }),
            el("td", { class: "l dim", text: a.products.join(" ") }),
          ]),
        );
      });
      wrap.appendChild(el("h3", { class: "h3", text: "Heaviest arcs" }));
      wrap.appendChild(t);
      if (f.betweenCentres.length > 18)
        wrap.appendChild(
          el("p", {
            class: "note",
            text:
              "Showing the 18 heaviest of " +
              f.betweenCentres.length +
              " arcs.",
          }),
        );
    } else {
      wrap.appendChild(
        el("p", {
          class: "note",
          text:
            "No arcs between centres: every part is finished inside the centre it starts in. " +
            "All " +
            qty(f.inside) +
            " moves are internal handling.",
        }),
      );
    }
    return wrap;
  }

  function diagram(r) {
    var f = r.flows;
    var ids = r.centres.map(function (c) {
      return c.id;
    });
    var W = 760,
      H = 460,
      cx = W / 2,
      cy = H / 2;
    var R = Math.min(W, H) / 2 - 58;
    var box = el("div", { class: "diagram" });
    var s = svg("svg", {
      viewBox: "0 0 " + W + " " + H,
      width: "100%",
      class: "net",
    });

    var pos = {};
    ids.forEach(function (id, i) {
      var a = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
      pos[id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    pos.IN = { x: 26, y: cy };
    pos.OUT = { x: W - 26, y: cy };

    var max = Math.max.apply(
      null,
      f.arcs
        .map(function (a) {
          return a.units;
        })
        .concat([1]),
    );
    f.arcs.forEach(function (a) {
      var p = pos[a.from],
        q = pos[a.to];
      if (!p || !q) return;
      var w = 0.6 + 5.4 * Math.sqrt(a.units / max);
      var terminal = a.from === "IN" || a.to === "OUT";
      var mx = (p.x + q.x) / 2,
        my = (p.y + q.y) / 2;
      var bend = 0.14;
      var path = svg("path", {
        d:
          "M " +
          num(p.x, 1) +
          " " +
          num(p.y, 1) +
          " Q " +
          num(mx + (my - cy) * bend, 1) +
          " " +
          num(my - (mx - cx) * bend, 1) +
          " " +
          num(q.x, 1) +
          " " +
          num(q.y, 1),
        fill: "none",
        stroke: terminal ? "#9aa7b4" : "#1f5fa8",
        "stroke-opacity": terminal ? 0.35 : 0.42,
        "stroke-width": num(w, 2),
        "stroke-linecap": "round",
      });
      path.appendChild(svg("title", {})).textContent =
        a.from + " → " + a.to + ": " + qty(a.units);
      s.appendChild(path);
    });

    function node(id, label, kind) {
      var p = pos[id];
      var g = svg("g", {});
      var rad = kind === "end" ? 17 : 20;
      g.appendChild(
        svg("circle", {
          cx: num(p.x, 1),
          cy: num(p.y, 1),
          r: rad,
          fill: kind === "end" ? "#eef1f5" : "#ffffff",
          stroke: kind === "end" ? "#9aa7b4" : "#1f5fa8",
          "stroke-width": 1.5,
        }),
      );
      var t = svg("text", {
        x: num(p.x, 1),
        y: num(p.y + 3.5, 1),
        "text-anchor": "middle",
        "font-size": label.length > 4 ? 8 : 10,
        fill: "#1d2733",
      });
      t.textContent = label;
      g.appendChild(t);
      return g;
    }
    s.appendChild(node("IN", "IN", "end"));
    s.appendChild(node("OUT", "OUT", "end"));
    ids.forEach(function (id) {
      s.appendChild(node(id, id.replace("F-", "")));
    });

    box.appendChild(s);
    box.appendChild(
      el("p", {
        class: "note",
        text:
          "Each arc is parts moving from one centre to the next in a period; thickness follows volume. " +
          "IN is incoming material, OUT is finished parts. Work that stays inside a centre draws no arc, " +
          "which is why a product-organized factory looks almost empty here and a function-organized one " +
          "looks like a web.",
      }),
    );
    return box;
  }

  /* ---------------- tab: over the years ---------------- */

  function yearsTab() {
    var wrap = el("div", {});
    wrap.appendChild(controls({ period: false }));

    var lines = Engine.ORGANIZATIONS.map(function (o) {
      return Engine.timeline(CASE, o.id, z());
    });
    var cheapest = lines.reduce(function (a, b) {
      return b.totalCost < a.totalCost ? b : a;
    });

    var t = el("table", { class: "big" });
    var head = [el("th", { class: "l", text: "Organization" })];
    CASE.periods.forEach(function (p) {
      head.push(el("th", { class: "r", text: p.replace("Year ", "Y") }));
    });
    ["Bought", "Moved", "Retired", "Cost of change", "Total capital"].forEach(
      function (h) {
        head.push(el("th", { class: "r", text: h }));
      },
    );
    t.appendChild(el("tr", {}, head));

    lines.forEach(function (L) {
      var cells = [el("td", { class: "l", text: L.org.name })];
      L.years.forEach(function (y) {
        cells.push(
          el("td", { class: "r strong", text: String(y.result.processors) }),
        );
      });
      var retired = L.steps.reduce(function (a, s) {
        return a + s.retired;
      }, 0);
      cells.push(el("td", { class: "r", text: qty(L.bought) }));
      cells.push(el("td", { class: "r", text: qty(L.moved) }));
      cells.push(el("td", { class: "r", text: qty(retired) }));
      cells.push(el("td", { class: "r", text: money(L.changeCost) }));
      cells.push(el("td", { class: "r strong", text: money(L.totalCost) }));
      t.appendChild(
        el(
          "tr",
          { class: L.org.id === cheapest.org.id ? "row-best" : "" },
          cells,
        ),
      );
    });
    wrap.appendChild(t);

    var L = lines.filter(function (x) {
      return x.org.id === state.org;
    })[0];
    wrap.appendChild(el("h3", { class: "h3", text: "Year on year" }));
    wrap.appendChild(orgPicker());

    var st = el("table", { class: "big" });
    st.appendChild(
      el("tr", {}, [
        el("th", { class: "l", text: "Change" }),
        el("th", { class: "r", text: "Machines added" }),
        el("th", { class: "r", text: "Machines freed" }),
        el("th", { class: "r", text: "Moved, not bought" }),
        el("th", { class: "r", text: "Newly bought" }),
        el("th", { class: "r", text: "Cost" }),
      ]),
    );
    L.steps.forEach(function (s) {
      st.appendChild(
        el("tr", {}, [
          el("td", { class: "l", text: s.from + " → " + s.to }),
          el("td", { class: "r", text: qty(s.added) }),
          el("td", { class: "r", text: qty(s.removed) }),
          el("td", { class: "r", text: qty(s.moved) }),
          el("td", { class: "r", text: qty(s.bought) }),
          el("td", { class: "r strong", text: money(s.cost) }),
        ]),
      );
    });
    wrap.appendChild(st);

    wrap.appendChild(
      el("div", { class: "insight" }, [
        el("h3", { text: "What the years are showing" }),
        el("p", {
          text:
            "Demand grows about " +
            pct(
              CASE.products.reduce(function (a, p) {
                return a + p.demand[CASE.periods.length - 1];
              }, 0) /
                CASE.products.reduce(function (a, p) {
                  return a + p.demand[0];
                }, 0) -
                1,
            ) +
            " in total over the horizon, but the mix turns over hard: P4 more than doubles, P2 falls to " +
            "a third, and P5 is withdrawn after Year 3. Total volume is not what makes a relayout " +
            "expensive — the change in its composition is.",
        }),
        el("p", {
          text:
            "A machine of the same operation leaving one centre while another centre needs one is moved " +
            "at " +
            money(CASE.money.relocate) +
            " rather than bought at " +
            money(CASE.money.install) +
            ". An organization whose centres are defined by product must close a centre when a product " +
            "goes, and that is where moving and retiring appear.",
        }),
        el("p", {
          class: "dim",
          text:
            "The two prices are placeholders. The lecture case carries none, and the figures here are " +
            "meant to be replaced; what matters to the comparison is that moving is far cheaper than buying.",
        }),
      ]),
    );
    return wrap;
  }

  /* ---------------- tab: layout ---------------- */

  function layoutTab() {
    var wrap = el("div", {});
    wrap.appendChild(controls({}));

    wrap.appendChild(orgPicker());

    var L = Engine.layout(CASE, state.org, state.period, z());
    var stats = el("div", { class: "stats" });
    [
      ["Building", Math.round(L.building.area) + " m\u00b2"],
      [
        "Shape",
        Math.round(L.building.w) + " \u00d7 " + Math.round(L.building.h) + " m",
      ],
      ["Taken by centres", pct(L.usedArea / L.building.area)],
      ["Floor cost", money(L.floorCost)],
      ["Travel per period", qty(L.travel) + " m"],
      ["Of that between centres", qty(L.betweenTravel) + " m"],
      ["Average move", num(L.perMove, 1) + " m"],
    ].forEach(function (s) {
      stats.appendChild(
        el("div", { class: "stat" }, [
          el("div", { class: "stat-k", text: s[0] }),
          el("div", { class: "stat-v", text: s[1] }),
        ]),
      );
    });
    wrap.appendChild(stats);
    wrap.appendChild(plan(L));

    wrap.appendChild(
      el("div", { class: "insight" }, [
        el("h3", { text: "The two levels" }),
        el("p", {
          text:
            "The lower level packs an operation's processors inside their centre; the upper level packs " +
            "the centres into the building, with a gangway between rows. Both are shelf packing, which " +
            "is crude but deterministic — good enough to turn a count of moves into a distance travelled " +
            "and a count of machines into floor area, and not good enough to be called a layout design.",
        }),
        el("p", {
          text:
            "Travel is rectilinear between centre centroids, the way a vehicle on aisles moves. It is " +
            "what layout adds that a flow count alone cannot show: a function organization makes the " +
            "most moves and so pays the most travel, while a product organization finishes each part " +
            "where it starts and only carries it in and out.",
        }),
        el("p", {
          class: "dim",
          text:
            "Machine footprints are an assumption. The slides draw the machines at different sizes but " +
            "give no dimensions, and unlike the demand and the times there is no count on a slide to " +
            "calibrate them against.",
        }),
      ]),
    );
    return wrap;
  }

  function plan(L) {
    var box = el("div", { class: "diagram" });
    var W = L.building.w,
      H = L.building.h;
    var m = 14;
    var s = svg("svg", {
      viewBox: -m + " " + -m + " " + (W + 2 * m) + " " + (H + 2 * m),
      width: "100%",
      class: "plan",
      preserveAspectRatio: "xMidYMid meet",
    });
    s.appendChild(
      svg("rect", {
        x: 0,
        y: 0,
        width: num(W, 1),
        height: num(H, 1),
        fill: "#fbfcfd",
        stroke: "#1d2733",
        "stroke-width": 1.2,
      }),
    );

    L.order.forEach(function (id) {
      var c = L.centres[id];
      if (!c) return;
      var g = svg("g", {});
      g.appendChild(
        svg("rect", {
          x: num(c.x, 1),
          y: num(c.y, 1),
          width: num(c.w, 1),
          height: num(c.h, 1),
          fill: "#ffffff",
          stroke: "#1f5fa8",
          "stroke-width": 0.7,
          rx: 0.6,
        }),
      );
      (c.inner.machines || []).forEach(function (mch) {
        var o = opInfo(mch.ref);
        g.appendChild(
          svg("rect", {
            x: num(c.x + mch.x * (c.w / Math.max(1, c.inner.w)), 2),
            y: num(c.y + mch.y * (c.h / Math.max(1, c.inner.h)), 2),
            width: num(mch.w * (c.w / Math.max(1, c.inner.w)) * 0.86, 2),
            height: num(mch.h * (c.h / Math.max(1, c.inner.h)) * 0.86, 2),
            fill: o ? o.fill : "#9aa7b4",
            "fill-opacity": 0.8,
            stroke: "rgba(0,0,0,.3)",
            "stroke-width": 0.25,
            rx: 0.3,
          }),
        );
      });
      var t = svg("text", {
        x: num(c.x + c.w / 2, 1),
        y: num(c.y - 1.2, 1),
        "text-anchor": "middle",
        "font-size": 2.6,
        fill: "#5d6a79",
      });
      t.textContent = id.replace("F-", "") + " \u00b7 " + c.processors;
      g.appendChild(t);
      box.appendChild(document.createTextNode(""));
      s.appendChild(g);
    });

    [
      ["IN", 0, H / 2],
      ["OUT", W, H / 2],
    ].forEach(function (d) {
      s.appendChild(
        svg("circle", {
          cx: num(d[1], 1),
          cy: num(d[2], 1),
          r: 2.2,
          fill: "#eef1f5",
          stroke: "#9aa7b4",
          "stroke-width": 0.6,
        }),
      );
      var t = svg("text", {
        x: num(d[1], 1),
        y: num(d[2] + 5.5, 1),
        "text-anchor": "middle",
        "font-size": 2.6,
        fill: "#5d6a79",
      });
      t.textContent = d[0];
      s.appendChild(t);
    });

    box.appendChild(s);
    box.appendChild(
      el("p", {
        class: "note",
        text:
          "Each outlined block is a centre, labelled with its machine count; the coloured rectangles " +
          "inside it are the processors, drawn in the colour of their operation. IN and OUT are the " +
          "docks on the two walls.",
      }),
    );
    return box;
  }

  /* ---------------- tab: compare ---------------- */

  function compareTab() {
    var wrap = el("div", {});
    wrap.appendChild(calibrationBanner());
    wrap.appendChild(controls({}));

    var rows = Engine.ORGANIZATIONS.map(function (o) {
      return Engine.evaluate(CASE, o.id, state.period, z());
    });
    var lay = {};
    Engine.ORGANIZATIONS.forEach(function (o) {
      lay[o.id] = Engine.layout(CASE, o.id, state.period, z());
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
        el("th", { class: "r", text: "For rounding" }),
        el("th", { class: "r", text: "Utilization" }),
        el("th", { class: "r", text: "Wait per visit" }),
        el("th", { class: "r", text: "Parts waiting" }),
        el("th", { class: "r", text: "Moves between centres" }),
        el("th", { class: "r", text: "Travel" }),
        el("th", { class: "r", text: "Floor" }),
        el("th", { class: "l", text: "" }),
      ]),
    );
    rows.forEach(function (r) {
      var cell = el("td", { class: "l wide" }, [
        el("span", { class: "bar bar-wide" }, [
          el("span", {
            class: "bar-fill bar-count",
            style: "width:" + pct(r.processors / most),
          }),
        ]),
      ]);
      t.appendChild(
        el("tr", { class: r.org.id === state.org ? "row-on" : "" }, [
          el("td", { class: "l", text: r.org.name }),
          el("td", { class: "r", text: String(r.centreCount) }),
          el("td", { class: "r strong", text: String(r.processors) }),
          el("td", { class: "r", text: "+" + num(r.rounding, 2) }),
          el("td", { class: "r", text: pct(r.utilization) }),
          el("td", { class: "r", text: mins(r.avgWait) }),
          el("td", { class: "r", text: num(r.waiting, 1) }),
          el("td", { class: "r", text: qty(r.flows.moves) }),
          el("td", { class: "r", text: qty(lay[r.org.id].travel) + " m" }),
          el("td", {
            class: "r",
            text: qty(lay[r.org.id].building.area) + " m\u00b2",
          }),
          cell,
        ]),
      );
    });
    wrap.appendChild(t);

    var f = rows.filter(function (r) {
      return r.org.id === "function";
    })[0];
    var p = rows.filter(function (r) {
      return r.org.id === "product";
    })[0];
    var h = rows.filter(function (r) {
      return r.org.id === "holographic";
    })[0];

    wrap.appendChild(
      el("div", { class: "insight" }, [
        el("h3", { text: "Reading the table" }),
        el("p", {
          text:
            "The work to be done never changes: " +
            num(f.theoretical, 2) +
            " processors' worth, whichever way the factory is cut. What changes is how many times that " +
            "work is divided before each piece is rounded up to a whole machine.",
        }),
        el("p", {
          text:
            "The function organization pools every product's demand for an operation and rounds up once " +
            "per operation: " +
            f.processors +
            " machines. The product organization rounds up inside each of its centres: " +
            p.processors +
            " machines for the same output, and " +
            qty(p.flows.moves) +
            " moves between centres against " +
            qty(f.flows.moves) +
            " — it buys machines to avoid travel.",
        }),
        el("p", {
          text:
            "The holographic organization holds the same " +
            h.processors +
            " machines as the function organization, at the same utilization, yet a part waits " +
            mins(h.avgWait) +
            " against " +
            mins(f.avgWait) +
            ". Breaking one pool of machines into separate single-machine centres costs nothing in " +
            "capital and a great deal in queueing, and that is what it pays for the freedom to place " +
            "them anywhere.",
        }),
        el("p", {
          text:
            "Laid out, the account closes. The product organization carries parts " +
            qty(lay.product.travel) +
            " metres a period and the function organization " +
            qty(lay["function"].travel) +
            " — the machines a product organization buys are what it spends to avoid that travel, and " +
            "the floor it needs for them, " +
            qty(lay.product.building.area) +
            " m\u00b2 against " +
            qty(lay["function"].building.area) +
            " m\u00b2, is part of the bill.",
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
            "Organization Design Fundamentals, version 2025/10/14, after Montreuil & Lefrancois (1996). " +
            "The equipment counts the tool is calibrated against are read off slide 19.",
        }),
        el("p", {
          text:
            "Demand and operation times are not on the slides. They are synthetic, fitted until the " +
            "function organization in Year 1 computes exactly the processors drawn on slide 19. A period " +
            "is one " +
            CASE.period.hours +
            "-hour workday at " +
            pct(CASE.period.efficiency) +
            " processor efficiency, the convention of slide 64, so one processor offers " +
            Engine.availableMinutes(CASE) +
            " minutes per period.",
        }),
      ]),
    );

    var t = el("table", { class: "big" });
    var head = [el("th", { class: "l", text: "Product" })];
    CASE.periods.forEach(function (p) {
      head.push(el("th", { class: "r", text: p }));
    });
    head.push(el("th", { class: "r", text: "Demand CoV" }));
    head.push(el("th", { class: "l", text: "Route, with minutes per unit" }));
    t.appendChild(el("tr", {}, head));

    CASE.products.forEach(function (p) {
      var cells = [el("td", { class: "l strong", text: p.id })];
      CASE.periods.forEach(function (_, i) {
        var inp = el("input", {
          class: "dem",
          type: "number",
          min: "0",
          step: "10",
          value: String(p.demand[i]),
        });
        inp.addEventListener("change", function () {
          var v = Number(inp.value);
          if (isFinite(v) && v >= 0) {
            p.demand[i] = v;
            render();
          }
        });
        cells.push(el("td", { class: "r" }, [inp]));
      });
      var cv = el("input", {
        class: "dem narrow",
        type: "number",
        min: "0",
        max: "1",
        step: "0.01",
        value: String(p.cv),
      });
      cv.addEventListener("change", function () {
        var v = Number(cv.value);
        if (isFinite(v) && v >= 0 && v <= 1) {
          p.cv = v;
          render();
        }
      });
      cells.push(el("td", { class: "r" }, [cv]));

      var route = el("span", { class: "route" });
      p.route.forEach(function (op, i) {
        if (i) route.appendChild(el("span", { class: "arrow", text: "→" }));
        var t = el("input", {
          class: "step-in",
          type: "number",
          min: "0.05",
          max: "60",
          step: "0.01",
          value: String(Engine.timeOf(CASE, op, p.id)),
          title: op + " on " + p.id + ", minutes per unit",
        });
        t.addEventListener("change", function () {
          var v = Number(t.value);
          if (isFinite(v) && v > 0) {
            CASE.times[op][p.id] = v;
            render();
          }
        });
        route.appendChild(el("span", { class: "step" }, [glyph(op, 16), t]));
      });
      cells.push(el("td", { class: "l" }, [route]));
      t.appendChild(el("tr", {}, cells));
    });
    wrap.appendChild(t);

    wrap.appendChild(
      el("p", {
        class: "note",
        text:
          "Change a demand or a coefficient of variation and every tab recomputes. The banner turns " +
          "amber as soon as Year 1 stops reproducing slide 19, which is the signal that the case has " +
          "drifted away from the one taught in class.",
      }),
    );

    var sl = Engine.evaluate(CASE, "function", state.period, z());
    var mean = Engine.evaluate(CASE, "function", state.period, 0);
    wrap.appendChild(el("h3", { class: "h3", text: "What robustness costs" }));
    var rt = el("table", { class: "big" });
    rt.appendChild(
      el("tr", {}, [
        el("th", { class: "l", text: "Capacity sized for" }),
        el("th", { class: "r", text: "Processors needed" }),
        el("th", { class: "r", text: "Machines" }),
        el("th", { class: "r", text: "Utilization" }),
      ]),
    );
    CASE.serviceLevels.forEach(function (lvl, i) {
      var r = Engine.evaluate(CASE, "function", state.period, lvl.z);
      var planned = r.centres.reduce(function (a, c) {
        return (
          a +
          c.stations.reduce(function (b, s) {
            return b + s.planned;
          }, 0)
        );
      }, 0);
      rt.appendChild(
        el("tr", { class: state.sl === i ? "row-on" : "" }, [
          el("td", {
            class: "l",
            text: lvl.label === "mean" ? "the mean" : lvl.label + " of periods",
          }),
          el("td", {
            class: "r",
            text: num(planned / Engine.availableMinutes(CASE), 2),
          }),
          el("td", { class: "r strong", text: String(r.processors) }),
          el("td", { class: "r", text: pct(r.utilization) }),
        ]),
      );
    });
    wrap.appendChild(rt);
    wrap.appendChild(
      el("p", {
        class: "note",
        text:
          "Demand for each product is treated as one random quantity with the coefficient of variation " +
          "above, products independent of one another. Pooling seven products leaves the function " +
          "organization with a spread of only a few per cent, which is why 95% and 99% often land on the " +
          "same whole machines — a result worth showing rather than hiding.",
      }),
    );

    wrap.appendChild(
      el("h3", { class: "h3", text: "How the centres are formed" }),
    );
    var forms = el("div", { class: "forms" });

    var gbox = el("div", { class: "form" });
    gbox.appendChild(el("div", { class: "form-k", text: "Group centres" }));
    CASE.groups.forEach(function (g, i) {
      var inp = el("input", {
        class: "text",
        value: g.products.join(" "),
        title: "products assigned to " + g.id,
      });
      inp.addEventListener("change", function () {
        var want = inp.value
          .toUpperCase()
          .split(/[^A-Z0-9]+/)
          .filter(Boolean);
        var known = Engine.allProducts(CASE);
        CASE.groups[i].products = want.filter(function (p) {
          return known.indexOf(p) >= 0;
        });
        render();
      });
      gbox.appendChild(
        el("div", { class: "form-row" }, [
          el("span", { class: "form-id", text: g.id }),
          inp,
        ]),
      );
    });
    var missing = Engine.allProducts(CASE).filter(function (p) {
      return !CASE.groups.some(function (g) {
        return g.products.indexOf(p) >= 0;
      });
    });
    gbox.appendChild(
      el("div", {
        class: missing.length ? "form-warn" : "form-ok",
        text: missing.length
          ? "not in any group: " + missing.join(" ")
          : "every product is in exactly one group",
      }),
    );
    forms.appendChild(gbox);

    var pbox = el("div", { class: "form" });
    pbox.appendChild(el("div", { class: "form-k", text: "Composite centres" }));
    CASE.processCenters.forEach(function (pc, i) {
      var inp = el("input", {
        class: "text",
        value: pc.ops.join(" "),
        title: "operations carried by " + pc.id,
      });
      inp.addEventListener("change", function () {
        var want = inp.value
          .toUpperCase()
          .split(/[^A-Z0-9]+/)
          .filter(Boolean);
        var known = Engine.allOps(CASE);
        CASE.processCenters[i].ops = want.filter(function (o) {
          return known.indexOf(o) >= 0;
        });
        render();
      });
      pbox.appendChild(
        el("div", { class: "form-row" }, [
          el("span", { class: "form-id", text: pc.id }),
          inp,
        ]),
      );
    });
    var uncovered = Engine.allOps(CASE).filter(function (o) {
      return !CASE.processCenters.some(function (pc) {
        return pc.ops.indexOf(o) >= 0;
      });
    });
    pbox.appendChild(
      el("div", {
        class: uncovered.length ? "form-warn" : "form-ok",
        text: uncovered.length
          ? "not in any centre: " + uncovered.join(" ")
          : "every operation is in a centre",
      }),
    );
    forms.appendChild(pbox);
    wrap.appendChild(forms);
    wrap.appendChild(
      el("p", {
        class: "note",
        text:
          "An operation left out of every composite centre falls back to a centre of its own, so the " +
          "process organization always makes all the parts. A product left out of every group is not " +
          "made at all by the group organization, which the line above warns about.",
      }),
    );

    wrap.appendChild(el("h3", { class: "h3", text: "Carry a case away" }));
    var files = el("div", { class: "picker" });
    files.appendChild(
      el("button", {
        class: "pick",
        text: "Save this case",
        onclick: saveCase,
      }),
    );
    var file = el("input", {
      type: "file",
      accept: ".json",
      class: "hidden-file",
    });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        loadCase(String(fr.result));
      };
      fr.readAsText(f);
    });
    files.appendChild(
      el("button", {
        class: "pick",
        text: "Load a case",
        onclick: function () {
          file.click();
        },
      }),
    );
    files.appendChild(
      el("button", {
        class: "pick",
        text: "Back to the lecture case",
        onclick: function () {
          loadCase(JSON.stringify(ORIGINAL));
        },
      }),
    );
    files.appendChild(file);
    wrap.appendChild(files);
    wrap.appendChild(
      el("p", {
        class: "note",
        text:
          "Saving writes the whole case — products, routes, demand per year, variability, times, " +
          "footprints, groups and prices — to a file. Loading one back replaces the case in the page, " +
          "so a variant can be built, kept and handed on.",
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

  /* ---------------- tab: scope ---------------- */

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
        "The seven-product case with its routings, demand per year, variability and operation times, all editable.",
        "Required processors and utilization per centre, computed from demand and times alone.",
        "Capacity sized for the mean or for a stated robustness, with what that robustness costs in machines.",
        "The queue in front of every station, from Erlang C on its offered load.",
        "Six organizations: product, group, fractal, function, process, holographic.",
        "The organizational network, with the flow between centres and what stays inside one.",
        "Four years of demand, the machines bought, moved and retired between them, and what the change costs.",
        "A standing check that Year 1 at the mean still reproduces the counts on slide 19.",
      ]),
    );
    wrap.appendChild(
      block(
        "Not here yet",
        [
          "Layout: equipment inside a centre, and centres inside the factory.",
          "Travel distance and traffic, as opposed to the number of moves.",
          "Work in process held between machines and between centres.",
          "Operators, floor space, and operating cost as against capital.",
          "Setup times, which the lecture sets aside for now.",
          "Letting the user form the groups and composite centres on the page.",
        ],
        "insight-soft",
      ),
    );
    wrap.appendChild(
      block(
        "Open questions",
        [
          "A composite centre is modelled with processors flexible across its operations, as slide 67 does. That makes the process organization the leanest of all, below the function organization — so the function organization is the leanest only among dedicated-processor designs.",
          "The holographic organization is modelled as the function organization's machines stood up as separate single-machine centres, each carrying an equal share. Is that the intended reading, or should instances be unequal?",
          "Relocation and purchase prices are placeholders. Real figures would make the yearly comparison meaningful.",
          "Slide 66 prints TOTAL 46 while its own column A2 B1 C4 D7 E4 F1 G1 H9 I13 J1 sums to 43, and the drawing shows 43 processors. The missing three may be the MP/PF blocks.",
          "On slide 64 of the A-to-J case, operation I is drawn with 13 processors where the stated 86% utilization implies 12.",
        ],
        "insight-ask",
      ),
    );
    return wrap;
  }

  /* ---------------- carrying a case away ----------------
   *
   * The whole case travels as one JSON file, so a variant can be built in the
   * page, kept, and handed to someone else. The lecture case is held aside at
   * load so there is always a way back to the one the slides reconcile with.
   */

  var FIELDS = [
    "period",
    "operations",
    "periods",
    "products",
    "times",
    "drawn",
    "groups",
    "processCenters",
    "fractalCount",
    "money",
    "space",
    "serviceLevels",
  ];

  function snapshot() {
    return FIELDS.reduce(function (a, k) {
      a[k] = CASE[k];
      return a;
    }, {});
  }

  var ORIGINAL = JSON.parse(JSON.stringify(snapshot()));

  function saveCase() {
    var blob = new Blob([JSON.stringify(snapshot(), null, 1)], {
      type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "factory-organization-case.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }

  function loadCase(txt) {
    var data;
    try {
      data = JSON.parse(txt);
    } catch (e) {
      window.alert("That file is not a saved case.");
      return false;
    }
    var need = ["products", "operations", "times", "periods"];
    var missing = need.filter(function (k) {
      return !data[k];
    });
    if (missing.length) {
      window.alert("That file has no " + missing.join(", ") + ".");
      return false;
    }
    FIELDS.forEach(function (k) {
      if (data[k] !== undefined) CASE[k] = JSON.parse(JSON.stringify(data[k]));
    });
    state.period = 0;
    state.sl = 0;
    render();
    return true;
  }

  /* ---------------- shell ---------------- */

  var TABS = [
    ["capacity", "Capacity", capacityTab],
    ["network", "Network", networkTab],
    ["layout", "Layout", layoutTab],
    ["years", "Over the years", yearsTab],
    ["compare", "Compare", compareTab],
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
