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
 */

var Engine = (function () {
  function availableMinutes(c) {
    return c.period.hours * 60 * c.period.efficiency;
  }

  function demandOf(c, productId, period) {
    var p = c.products.filter(function (x) {
      return x.id === productId;
    })[0];
    if (!p) return 0;
    var d = p.demand[period];
    return typeof d === "number" ? d : 0;
  }

  function routeOf(c, productId) {
    var p = c.products.filter(function (x) {
      return x.id === productId;
    })[0];
    return p ? p.route : [];
  }

  function timeOf(c, op, productId) {
    var row = c.times[op];
    if (!row) return 0;
    var t = row[productId];
    return typeof t === "number" ? t : 0;
  }

  /* Minutes of operation `op` demanded by a set of products in a period,
   * counting a product once per visit (a route may use an operation twice). */
  function workload(c, op, productIds, period, share) {
    var f = typeof share === "number" ? share : 1;
    var total = 0;
    productIds.forEach(function (pid) {
      var visits = routeOf(c, pid).filter(function (o) {
        return o === op;
      }).length;
      if (!visits) return;
      total += demandOf(c, pid, period) * visits * timeOf(c, op, pid) * f;
    });
    return total;
  }

  function ceilAt(x) {
    // guard float noise so 2.0000000001 does not ask for a third machine
    return Math.ceil(Number(x.toFixed(9)));
  }

  /* A station is one pool of interchangeable processors inside a centre.
   * A dedicated station serves one operation; a flexible station serves
   * several, which is what lets a composite centre pool its ceilings. */
  function station(c, label, ops, productIds, period, share) {
    var minutes = 0;
    ops.forEach(function (op) {
      minutes += workload(c, op, productIds, period, share);
    });
    var avail = availableMinutes(c);
    var n = ceilAt(minutes / avail);
    return {
      label: label,
      ops: ops.slice(),
      minutes: minutes,
      processors: n,
      load: minutes / avail,
      utilization: n ? minutes / (n * avail) : 0,
    };
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

  /* ---- the organizations, in the order the lecture introduces them ---- */

  var ORGANIZATIONS = [
    {
      id: "product",
      name: "Product organization",
      blurb:
        "One centre per product. Each centre owns every operation its product needs, so every centre rounds up on its own.",
      build: function (c, period) {
        return allProducts(c).map(function (pid) {
          var sts = routeOf(c, pid)
            .filter(function (op, i, a) {
              return a.indexOf(op) === i;
            })
            .map(function (op) {
              return station(c, op, [op], [pid], period);
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
      build: function (c, period) {
        return c.groups.map(function (g) {
          var ops = [];
          g.products.forEach(function (pid) {
            routeOf(c, pid).forEach(function (op) {
              if (ops.indexOf(op) < 0) ops.push(op);
            });
          });
          var sts = ops.map(function (op) {
            return station(c, op, [op], g.products, period);
          });
          return centre(c, g.id, sts);
        });
      },
    },
    {
      id: "fractal",
      name: "Fractal organization",
      blurb:
        "f look-alike centres, each making every product at about 1/f of the demand. Scaling means adding another whole centre.",
      build: function (c, period) {
        var f = Math.max(1, c.fractalCount | 0);
        var out = [];
        for (var i = 0; i < f; i++) {
          var sts = allOps(c).map(function (op) {
            return station(c, op, [op], allProducts(c), period, 1 / f);
          });
          out.push(centre(c, "f" + (i + 1), sts));
        }
        return out;
      },
    },
    {
      id: "function",
      name: "Function organization",
      blurb:
        "One centre per elementary operation. Every product's demand for that operation is pooled, so this is the fewest machines.",
      build: function (c, period) {
        return allOps(c).map(function (op) {
          return centre(c, "F-" + op, [
            station(c, op, [op], allProducts(c), period),
          ]);
        });
      },
    },
    {
      id: "process",
      name: "Process organization",
      blurb:
        "Composite centres holding several operations, served by processors flexible across them, so the ceilings pool too.",
      build: function (c, period) {
        return c.processCenters.map(function (pc) {
          return centre(c, pc.id, [
            station(c, pc.ops.join("+"), pc.ops, allProducts(c), period),
          ]);
        });
      },
    },
    {
      id: "holographic",
      name: "Holographic organization",
      blurb:
        "The function pool broken into single-processor centres scattered through the factory. Same machine count, many more centres.",
      build: function (c, period) {
        var out = [];
        allOps(c).forEach(function (op) {
          var pooled = station(c, op, [op], allProducts(c), period);
          var left = pooled.minutes;
          var avail = availableMinutes(c);
          for (var i = 0; i < pooled.processors; i++) {
            var mine = Math.min(left, avail);
            left -= mine;
            out.push({
              id: op + "." + (i + 1),
              stations: [
                {
                  label: op,
                  ops: [op],
                  minutes: mine,
                  processors: 1,
                  load: mine / avail,
                  utilization: mine / avail,
                },
              ],
              processors: 1,
              minutes: mine,
            });
          }
        });
        return out;
      },
    },
  ];

  function byId(id) {
    return ORGANIZATIONS.filter(function (o) {
      return o.id === id;
    })[0];
  }

  function evaluate(c, orgId, period) {
    var org = byId(orgId);
    var centres = org.build(c, period);
    var avail = availableMinutes(c);
    var processors = centres.reduce(function (a, x) {
      return a + x.processors;
    }, 0);
    var minutes = centres.reduce(function (a, x) {
      return a + x.minutes;
    }, 0);
    var perOp = {};
    centres.forEach(function (ct) {
      ct.stations.forEach(function (s) {
        s.ops.forEach(function (op) {
          perOp[op] = (perOp[op] || 0) + s.processors / s.ops.length;
        });
      });
    });
    return {
      org: org,
      centres: centres,
      processors: processors,
      minutes: minutes,
      centreCount: centres.length,
      // work the factory cannot avoid, in whole processors
      theoretical: minutes / avail,
      // machines bought purely because ceilings do not share
      rounding: processors - minutes / avail,
      utilization: processors ? minutes / (processors * avail) : 0,
      perOp: perOp,
    };
  }

  /* Does the function organization reproduce the counts drawn on slide 19? */
  function calibration(c, period) {
    var r = evaluate(c, "function", period);
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
    workload: workload,
    evaluate: evaluate,
    calibration: calibration,
    byId: byId,
    allProducts: allProducts,
    allOps: allOps,
    routeOf: routeOf,
    timeOf: timeOf,
    demandOf: demandOf,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Engine;
}
