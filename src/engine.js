/* Factory Organization Designer — the capacity engine
 *
 * One rule runs the whole tool:
 *
 *     processors in a centre = ceil( work the centre is given / work one processor can do )
 *     utilization            = work given / (processors * work one processor can do)
 *
 * Everything that distinguishes one organization from another is which work
 * lands in which centre before that ceiling is taken. Splitting the factory
 * finer means more ceilings, and every ceiling wastes a fraction of a machine.
 *
 * Around that rule sit four things the lecture asks for and the slides cannot
 * show: capacity sized for a stated robustness rather than for the average,
 * the queue that builds in front of a busy centre, the flow between centres,
 * and what it costs to change the factory from one year to the next.
 */

var Engine = (function () {
  /* ---------------- the case, read ---------------- */

  function availableMinutes(c) {
    return c.period.hours * 60 * c.period.efficiency;
  }
  function product(c, id) {
    return c.products.filter(function (p) {
      return p.id === id;
    })[0];
  }
  function allProducts(c) {
    return c.products.map(function (p) {
      return p.id;
    });
  }
  function allOps(c) {
    return c.operations.map(function (o) {
      return o.id;
    });
  }
  function routeOf(c, id) {
    var p = product(c, id);
    return p ? p.route : [];
  }
  function demandOf(c, id, period) {
    var p = product(c, id);
    if (!p) return 0;
    var d = p.demand[Math.min(period, p.demand.length - 1)];
    return typeof d === "number" ? d : 0;
  }
  function cvOf(c, id) {
    var p = product(c, id);
    return p && typeof p.cv === "number" ? p.cv : 0;
  }
  function timeOf(c, op, id) {
    var row = c.times[op];
    return row && typeof row[id] === "number" ? row[id] : 0;
  }
  function visits(c, op, id) {
    return routeOf(c, id).filter(function (o) {
      return o === op;
    }).length;
  }

  function ceilAt(x) {
    return Math.ceil(Number(x.toFixed(9)));
  }

  /* ---------------- work, with its spread ----------------
   *
   * A product's demand is one random quantity, so every minute that product
   * puts into a centre moves together. The spread is therefore taken per
   * product and only then combined across products, which are independent.
   */

  function workStats(c, ops, productIds, period, share) {
    var f = typeof share === "number" ? share : 1;
    var mean = 0,
      variance = 0,
      units = 0,
      itemMinutes = 0;
    productIds.forEach(function (pid) {
      var perUnit = 0,
        v = 0;
      ops.forEach(function (op) {
        var n = visits(c, op, pid);
        if (!n) return;
        perUnit += n * timeOf(c, op, pid);
        v += n;
      });
      if (!perUnit) return;
      var d = demandOf(c, pid, period) * f;
      mean += d * perUnit;
      variance += Math.pow(cvOf(c, pid) * d * perUnit, 2);
      units += d * v; // item visits arriving at this station
      itemMinutes += d * perUnit;
    });
    return {
      mean: mean,
      sd: Math.sqrt(variance),
      arrivals: units,
      serviceMinutes: units ? itemMinutes / units : 0,
    };
  }

  /* ---------------- queueing at a station ----------------
   *
   * Erlang C on the offered load, so a centre that is nearly full is shown
   * with the waiting it actually causes rather than only with its utilization.
   */

  function erlangC(servers, offered) {
    if (servers <= 0) return 1;
    if (offered >= servers) return 1;
    var b = 1;
    for (var k = 1; k <= servers; k++) b = (offered * b) / (k + offered * b);
    var rho = offered / servers;
    return b / (1 - rho * (1 - b));
  }

  function queueOf(station, avail) {
    var offered = station.minutes / avail;
    var c = station.processors;
    if (!c || !station.arrivals) return { wait: 0, length: 0, pWait: 0 };
    if (offered >= c) return { wait: Infinity, length: Infinity, pWait: 1 };
    var pWait = erlangC(c, offered);
    var rho = offered / c;
    // mean wait in minutes before service starts
    var wait = (pWait * station.serviceMinutes) / (c * (1 - rho));
    var rate = station.arrivals / avail; // items per minute
    return { wait: wait, length: rate * wait, pWait: pWait };
  }

  /* ---------------- a station and a centre ---------------- */

  function station(c, label, ops, productIds, period, share, z) {
    var st = workStats(c, ops, productIds, period, share);
    var avail = availableMinutes(c);
    var planned = st.mean + (z || 0) * st.sd;
    var n = ceilAt(planned / avail);
    var s = {
      label: label,
      ops: ops.slice(),
      minutes: st.mean,
      sd: st.sd,
      planned: planned,
      arrivals: st.arrivals,
      serviceMinutes: st.serviceMinutes,
      processors: n,
      load: st.mean / avail,
      utilization: n ? st.mean / (n * avail) : 0,
    };
    s.queue = queueOf(s, avail);
    return s;
  }

  function centre(c, id, stations) {
    var kept = stations.filter(function (s) {
      return s.processors > 0;
    });
    return {
      id: id,
      stations: kept,
      processors: kept.reduce(function (a, s) {
        return a + s.processors;
      }, 0),
      minutes: kept.reduce(function (a, s) {
        return a + s.minutes;
      }, 0),
    };
  }

  /* ---------------- where a product's work happens ----------------
   *
   * A stream is a quantity of one product walking its route, step by step,
   * through named centres. Streams give the network its arcs, and they are
   * what makes a fractal factory different from a function factory even when
   * both hold the same machines.
   */

  function one(id) {
    return [{ centre: id, frac: 1 }];
  }

  function streams(c, orgId, period) {
    if (orgId === "holographic") return holographic(c, period, 0).streams;
    var out = [];
    if (orgId === "product") {
      allProducts(c).forEach(function (p) {
        out.push({
          product: p,
          units: demandOf(c, p, period),
          steps: routeOf(c, p).map(function () {
            return one(p);
          }),
        });
      });
    } else if (orgId === "group") {
      c.groups.forEach(function (g) {
        g.products.forEach(function (p) {
          out.push({
            product: p,
            units: demandOf(c, p, period),
            steps: routeOf(c, p).map(function () {
              return one(g.id);
            }),
          });
        });
      });
    } else if (orgId === "fractal") {
      var f = Math.max(1, c.fractalCount | 0);
      for (var i = 0; i < f; i++) {
        var id = "f" + (i + 1);
        allProducts(c).forEach(function (p) {
          out.push({
            product: p,
            units: demandOf(c, p, period) / f,
            steps: routeOf(c, p).map(function () {
              return one(id);
            }),
          });
        });
      }
    } else if (orgId === "function") {
      allProducts(c).forEach(function (p) {
        out.push({
          product: p,
          units: demandOf(c, p, period),
          steps: routeOf(c, p).map(function (op) {
            return one("F-" + op);
          }),
        });
      });
    } else if (orgId === "process") {
      allProducts(c).forEach(function (p) {
        out.push({
          product: p,
          units: demandOf(c, p, period),
          steps: routeOf(c, p).map(function (op) {
            var pc = c.processCenters.filter(function (x) {
              return x.ops.indexOf(op) >= 0;
            })[0];
            return one(pc ? pc.id : "F-" + op);
          }),
        });
      });
    }
    return out;
  }

  /* Holographic counts an operation's machines exactly as the function
   * organization does, then stands each one up as its own centre carrying an
   * equal share of that operation's work — which is how a holographic factory
   * is run, with a job going to whichever instance is free.
   *
   * The machines are the same machines. What changes is that five processors
   * pooled in one centre become five separate single-processor centres, and a
   * single server at a given utilization makes a far longer queue than five
   * servers at that same utilization. That cost, and the extra travel between
   * scattered centres, is what the organization buys its flexibility with. */
  function holographic(c, period, z) {
    var avail = availableMinutes(c);
    var centres = [];
    var instancesOf = {};
    allOps(c).forEach(function (op) {
      var pooled = station(c, op, [op], allProducts(c), period, 1, z);
      var n = pooled.processors;
      instancesOf[op] = [];
      for (var i = 0; i < n; i++) {
        var id = op + "." + (i + 1);
        instancesOf[op].push(id);
        var s = {
          label: op,
          ops: [op],
          minutes: pooled.minutes / n,
          sd: pooled.sd / n,
          planned: pooled.planned / n,
          arrivals: pooled.arrivals / n,
          serviceMinutes: pooled.serviceMinutes,
          processors: 1,
          load: pooled.minutes / n / avail,
          utilization: pooled.minutes / n / avail,
        };
        s.queue = queueOf(s, avail);
        centres.push(centre(c, id, [s]));
      }
    });

    // a visit is as likely to land on any instance of its operation
    var sts = allProducts(c).map(function (p) {
      return {
        product: p,
        units: demandOf(c, p, period),
        steps: routeOf(c, p).map(function (op) {
          var list = instancesOf[op] || [];
          return list.map(function (id) {
            return { centre: id, frac: 1 / list.length };
          });
        }),
      };
    });
    return { centres: centres, streams: sts };
  }

  /* ---------------- the organizations ---------------- */

  var ORGANIZATIONS = [
    {
      id: "product",
      name: "Product organization",
      blurb:
        "One centre per product. Each centre owns every operation its product needs, so every centre rounds up on its own.",
      build: function (c, period, z) {
        return allProducts(c).map(function (pid) {
          var sts = routeOf(c, pid)
            .filter(function (op, i, a) {
              return a.indexOf(op) === i;
            })
            .map(function (op) {
              return station(c, op, [op], [pid], period, 1, z);
            });
          return centre(c, pid, sts);
        });
      },
    },
    {
      id: "group",
      name: "Group organization",
      blurb:
        "Products that travel alike are grouped, and each group gets a centre. Fewer ceilings than one centre per product.",
      build: function (c, period, z) {
        return c.groups.map(function (g) {
          var ops = [];
          g.products.forEach(function (pid) {
            routeOf(c, pid).forEach(function (op) {
              if (ops.indexOf(op) < 0) ops.push(op);
            });
          });
          return centre(
            c,
            g.id,
            ops.map(function (op) {
              return station(c, op, [op], g.products, period, 1, z);
            }),
          );
        });
      },
    },
    {
      id: "fractal",
      name: "Fractal organization",
      blurb:
        "f look-alike centres, each making every product at about 1/f of the demand. Growth means adding another whole centre.",
      build: function (c, period, z) {
        var f = Math.max(1, c.fractalCount | 0);
        var out = [];
        for (var i = 0; i < f; i++) {
          out.push(
            centre(
              c,
              "f" + (i + 1),
              allOps(c).map(function (op) {
                return station(c, op, [op], allProducts(c), period, 1 / f, z);
              }),
            ),
          );
        }
        return out;
      },
    },
    {
      id: "function",
      name: "Function organization",
      blurb:
        "One centre per elementary operation. Every product's demand for that operation is pooled, so this is the fewest dedicated machines.",
      build: function (c, period, z) {
        return allOps(c).map(function (op) {
          return centre(c, "F-" + op, [
            station(c, op, [op], allProducts(c), period, 1, z),
          ]);
        });
      },
    },
    {
      id: "process",
      name: "Process organization",
      blurb:
        "Composite centres holding several operations, served by processors flexible across them, so the ceilings pool too.",
      build: function (c, period, z) {
        return c.processCenters.map(function (pc) {
          return centre(c, pc.id, [
            station(c, pc.ops.join("+"), pc.ops, allProducts(c), period, 1, z),
          ]);
        });
      },
    },
    {
      id: "holographic",
      name: "Holographic organization",
      blurb:
        "The function pool broken into single-processor centres scattered through the factory, each loaded individually.",
      build: function (c, period, z) {
        return holographic(c, period, z).centres;
      },
    },
  ];

  function byId(id) {
    return ORGANIZATIONS.filter(function (o) {
      return o.id === id;
    })[0];
  }

  /* ---------------- flows between centres ---------------- */

  /* Units crossing from one centre to the next, summed over every product and
   * every step of its route, with IN standing for incoming materials and OUT
   * for finished parts. A step that may land on any of several machines splits
   * its units across them, so a scattered organization shows many thin arcs
   * where a concentrated one shows few thick ones. */
  function flows(c, orgId, period) {
    var sts = streams(c, orgId, period);
    var arcs = {};
    var inside = 0;
    function add(from, to, units, product) {
      if (units <= 0) return;
      if (from === to) {
        inside += units;
        return;
      }
      var k = from + "→" + to;
      if (!arcs[k]) arcs[k] = { from: from, to: to, units: 0, products: [] };
      arcs[k].units += units;
      if (arcs[k].products.indexOf(product) < 0) arcs[k].products.push(product);
    }
    sts.forEach(function (s) {
      if (!s.steps.length || !s.units) return;
      s.steps[0].forEach(function (a) {
        add("IN", a.centre, s.units * a.frac, s.product);
      });
      for (var i = 1; i < s.steps.length; i++) {
        s.steps[i - 1].forEach(function (a) {
          s.steps[i].forEach(function (b) {
            add(a.centre, b.centre, s.units * a.frac * b.frac, s.product);
          });
        });
      }
      s.steps[s.steps.length - 1].forEach(function (a) {
        add(a.centre, "OUT", s.units * a.frac, s.product);
      });
    });
    var list = Object.keys(arcs).map(function (k) {
      return arcs[k];
    });
    list.sort(function (a, b) {
      return b.units - a.units;
    });
    var between = list.filter(function (a) {
      return a.from !== "IN" && a.to !== "OUT";
    });
    return {
      arcs: list,
      betweenCentres: between,
      moves: between.reduce(function (a, x) {
        return a + x.units;
      }, 0),
      inside: inside,
    };
  }

  /* ---------------- one organization in one period ---------------- */

  function evaluate(c, orgId, period, z) {
    var org = byId(orgId);
    // A centre with no work is not standing: a product withdrawn from the
    // catalogue closes its centre, and the machines in it are freed.
    var centres = org.build(c, period, z || 0).filter(function (x) {
      return x.processors > 0;
    });
    var avail = availableMinutes(c);
    var processors = centres.reduce(function (a, x) {
      return a + x.processors;
    }, 0);
    var minutes = centres.reduce(function (a, x) {
      return a + x.minutes;
    }, 0);
    var worst = null,
      waited = 0,
      arrivals = 0;
    centres.forEach(function (ct) {
      ct.stations.forEach(function (s) {
        if (!worst || s.queue.wait > worst.wait)
          worst = { wait: s.queue.wait, centre: ct.id, station: s.label };
        if (s.arrivals && isFinite(s.queue.wait)) {
          waited += s.arrivals * s.queue.wait;
          arrivals += s.arrivals;
        }
      });
    });
    var f = flows(c, orgId, period);
    return {
      org: org,
      centres: centres,
      processors: processors,
      minutes: minutes,
      centreCount: centres.length,
      theoretical: minutes / avail,
      rounding: processors - minutes / avail,
      utilization: processors ? minutes / (processors * avail) : 0,
      flows: f,
      worstQueue: worst || { wait: 0, centre: "", station: "" },
      // minutes a part waits before being served, averaged over every visit it
      // makes: the price of breaking one pool of machines into several
      avgWait: arrivals ? waited / arrivals : 0,
      visits: arrivals,
    };
  }

  /* ---------------- the same organization across the years ----------------
   *
   * Between two years a centre may need more machines or fewer. A machine of
   * the same operation leaving one centre and appearing in another is moved,
   * not bought, which is the whole reason an organization that must be torn up
   * every year costs more than one that only grows.
   */

  function timeline(c, orgId, z) {
    var avail = availableMinutes(c);
    var years = c.periods.map(function (label, i) {
      var r = evaluate(c, orgId, i, z);
      var byCentreOp = {};
      var byOp = {};
      r.centres.forEach(function (ct) {
        ct.stations.forEach(function (s) {
          s.ops.forEach(function (op) {
            var k = ct.id + "|" + op;
            var share = s.processors / s.ops.length;
            byCentreOp[k] = (byCentreOp[k] || 0) + share;
            byOp[op] = (byOp[op] || 0) + share;
          });
        });
      });
      return { label: label, result: r, byCentreOp: byCentreOp, byOp: byOp };
    });

    var steps = [];
    for (var i = 1; i < years.length; i++) {
      var a = years[i - 1],
        b = years[i];
      var keys = Object.keys(a.byCentreOp)
        .concat(Object.keys(b.byCentreOp))
        .filter(function (k, j, arr) {
          return arr.indexOf(k) === j;
        });
      var added = 0,
        removed = 0;
      keys.forEach(function (k) {
        var d = (b.byCentreOp[k] || 0) - (a.byCentreOp[k] || 0);
        if (d > 0) added += d;
        else removed += -d;
      });
      // a removal and an addition of the same operation in the same step is a move
      var ops = Object.keys(a.byOp)
        .concat(Object.keys(b.byOp))
        .filter(function (k, j, arr) {
          return arr.indexOf(k) === j;
        });
      var moved = 0;
      ops.forEach(function (op) {
        var addOp = 0,
          remOp = 0;
        keys.forEach(function (k) {
          if (k.split("|")[1] !== op) return;
          var d = (b.byCentreOp[k] || 0) - (a.byCentreOp[k] || 0);
          if (d > 0) addOp += d;
          else remOp += -d;
        });
        moved += Math.min(addOp, remOp);
      });
      var bought = Math.max(0, added - moved);
      steps.push({
        from: a.label,
        to: b.label,
        added: added,
        removed: removed,
        moved: moved,
        bought: bought,
        retired: Math.max(0, removed - moved),
        cost: bought * c.money.install + moved * c.money.relocate,
      });
    }

    var first = years[0].result.processors;
    return {
      org: byId(orgId),
      years: years,
      steps: steps,
      initial: first,
      initialCost: first * c.money.install,
      changeCost: steps.reduce(function (a, s) {
        return a + s.cost;
      }, 0),
      totalCost:
        first * c.money.install +
        steps.reduce(function (a, s) {
          return a + s.cost;
        }, 0),
      bought: steps.reduce(function (a, s) {
        return a + s.bought;
      }, 0),
      moved: steps.reduce(function (a, s) {
        return a + s.moved;
      }, 0),
      peak: Math.max.apply(
        null,
        years.map(function (y) {
          return y.result.processors;
        }),
      ),
      avail: avail,
    };
  }

  /* ---------------- the standing reconciliation ---------------- */

  function calibration(c) {
    // always read on Year 1 at the mean, which is what slide 19 shows
    var r = evaluate(c, "function", 0, 0);
    var rows = allOps(c).map(function (op) {
      var ct = r.centres.filter(function (x) {
        return x.id === "F-" + op;
      })[0];
      var got = ct ? ct.processors : 0;
      return {
        op: op,
        drawn: c.drawn[op],
        computed: got,
        utilization: ct && ct.stations[0] ? ct.stations[0].utilization : 0,
        ok: got === c.drawn[op],
      };
    });
    return {
      rows: rows,
      ok: rows.every(function (x) {
        return x.ok;
      }),
      drawnTotal: rows.reduce(function (a, x) {
        return a + x.drawn;
      }, 0),
      computedTotal: rows.reduce(function (a, x) {
        return a + x.computed;
      }, 0),
    };
  }

  return {
    ORGANIZATIONS: ORGANIZATIONS,
    availableMinutes: availableMinutes,
    workStats: workStats,
    erlangC: erlangC,
    evaluate: evaluate,
    timeline: timeline,
    flows: flows,
    streams: streams,
    calibration: calibration,
    byId: byId,
    allProducts: allProducts,
    allOps: allOps,
    routeOf: routeOf,
    timeOf: timeOf,
    demandOf: demandOf,
    cvOf: cvOf,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Engine;
}
