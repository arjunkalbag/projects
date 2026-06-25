/* Projects — an interactive carousel of blobby, color-matched brand logos.
 *
 * Recreated from a Claude Design handoff (originally a React/Babel prototype)
 * as a dependency-free standalone page. Every logo runs its own
 * requestAnimationFrame loop and mutates SVG attributes directly; the carousel
 * shell, cursor, wordmark and corner signature are plain DOM. All of the
 * geometry / easing math is preserved verbatim from the prototype so the
 * visual output is identical.
 */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---- tiny element builders ---- */
  function H(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "class") e.className = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
    }
    append(e, children);
    return e;
  }
  function S(tag, attrs, children) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    append(e, children);
    return e;
  }
  function append(e, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c == null) continue;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
  }
  // gradient with [offset, color, opacity?] stops
  function grad(type, id, attrs, stops) {
    attrs = attrs || {};
    attrs.id = id;
    var g = S(type, attrs);
    for (var i = 0; i < stops.length; i++) {
      var s = stops[i];
      var sa = { offset: s[0], "stop-color": s[1] };
      if (s[2] != null) sa["stop-opacity"] = s[2];
      g.appendChild(S("stop", sa));
    }
    return g;
  }

  /* ---- frame loop + click impulse ---- */
  function raf(cb) {
    var id, start = performance.now();
    function loop(now) {
      try { cb((now - start) / 1000); }
      catch (err) { console.error("raf error:", err && err.message, err && err.stack); }
      id = requestAnimationFrame(loop);
    }
    id = requestAnimationFrame(loop);
    return function () { cancelAnimationFrame(id); };
  }
  // click impulse: snaps to 1 on a matching 'blob-kick' event, then decays.
  function kick(key) {
    var k = { imp: 0 };
    window.addEventListener("blob-kick", function (e) {
      if (e.detail && e.detail.key === key) k.imp = 1;
    });
    return k;
  }

  /* ---- organic geometry helpers ---- */
  function closedPath(pts) {
    var n = pts.length;
    var d = "M " + pts[0][0].toFixed(2) + " " + pts[0][1].toFixed(2) + " ";
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += "C " + c1x.toFixed(2) + " " + c1y.toFixed(2) + " " + c2x.toFixed(2) + " " + c2y.toFixed(2) +
        " " + p2[0].toFixed(2) + " " + p2[1].toFixed(2) + " ";
    }
    return d + "Z";
  }
  function blobPts(cx, cy, baseR, n, t, o) {
    o = o || {};
    var amp = o.amp == null ? 10 : o.amp, f1 = o.f1 == null ? 2 : o.f1, f2 = o.f2 == null ? 5 : o.f2,
      speed = o.speed == null ? 1 : o.speed, phase = o.phase == null ? 0 : o.phase,
      squashY = o.squashY == null ? 1 : o.squashY, lobes = o.lobes == null ? 0 : o.lobes,
      lobeAmp = o.lobeAmp == null ? 0 : o.lobeAmp;
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var r = baseR;
      r += Math.sin(a * f1 + t * speed + phase) * amp;
      r += Math.sin(a * f2 - t * speed * 1.3 + phase * 2) * amp * 0.5;
      if (lobes) r += Math.cos(a * lobes + t * 0.2) * lobeAmp;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * squashY]);
    }
    return pts;
  }

  /* ---- 1. Playback — two dots, one black, one red ---- */
  function BlobPlayback() {
    var k = kick("playback");
    var a = S("path", { d: closedPath(blobPts(134, 200, 58, 90, 0, { amp: 4, f1: 2, f2: 5, speed: 0.9 })), fill: "url(#pb-k)" });
    var b = S("path", { d: closedPath(blobPts(266, 200, 58, 90, 0, { amp: 4, f1: 3, f2: 4, speed: 1.0, phase: 1.6 })), fill: "url(#pb-r)" });
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [
        grad("radialGradient", "pb-k", { cx: "40%", cy: "34%", r: "78%" }, [["0%", "#3c3c3c"], ["100%", "#070707"]]),
        grad("radialGradient", "pb-r", { cx: "40%", cy: "34%", r: "78%" }, [["0%", "#FF8266"], ["55%", "#F23A20"], ["100%", "#C51E0C"]])
      ]),
      a, b
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      var ang = t * 0.45;
      var R = 66 + e * 46;
      var bob = Math.sin(t * 0.9) * 4;
      a.setAttribute("d", closedPath(blobPts(200 + Math.cos(ang) * R, 200 + Math.sin(ang) * R + bob, 58, 90, t, { amp: 4 + e * 18, f1: 2, f2: 5, speed: 0.9 })));
      b.setAttribute("d", closedPath(blobPts(200 - Math.cos(ang) * R, 200 - Math.sin(ang) * R - bob, 58, 90, t * 1.05, { amp: 4 + e * 18, f1: 3, f2: 4, speed: 1.0, phase: 1.6 })));
    });
    return svg;
  }

  /* ---- 2. create report engine — orange asterisk / sunburst ---- */
  function BlobReport() {
    var k = kick("report");
    var NS = 8;
    var spokes = [];
    for (var i = 0; i < NS; i++) {
      spokes.push(S("rect", { x: "-25", y: "-142", width: "50", height: "128", rx: "13", fill: "url(#rp-g)", transform: "rotate(" + (i * 45) + ")" }));
    }
    var g = S("g", null, spokes);
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [grad("linearGradient", "rp-g", { x1: "0", y1: "0", x2: "0", y2: "1" }, [["0%", "#F8923A"], ["100%", "#EB6710"]])]),
      g
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      g.setAttribute("transform", "translate(200 200) rotate(" + (t * 4 + e * 26) + ") scale(" + (1 + Math.sin(t * 0.8) * 0.02).toFixed(3) + ")");
      var w = 50 + e * 8;
      for (var i = 0; i < NS; i++) {
        var r = spokes[i];
        if (!r) continue;
        var len = 142 + Math.sin(t * 1.25 + i * 0.7) * 6 + e * 48;
        r.setAttribute("y", (-len).toFixed(1));
        r.setAttribute("height", (len - 14).toFixed(1));
        r.setAttribute("width", w.toFixed(1));
        r.setAttribute("x", (-w / 2).toFixed(1));
      }
    });
    return svg;
  }

  /* ---- 3. Needl — spinning vinyl record + tonearm (blue) ---- */
  function BlobNeedl() {
    var k = kick("needl");
    var disc = S("path", { d: closedPath(blobPts(200, 200, 134, 170, 0, { amp: 4, f1: 2, f2: 4, speed: 0.55 })), fill: "url(#nd-g)" });
    var g1 = S("path", { d: closedPath(blobPts(200, 200, 106, 150, 0, { amp: 3, f1: 3, f2: 5, speed: 0.7 })), fill: "none", stroke: "#3E6FD6", "stroke-width": "2.5", opacity: "0.55" });
    var g2 = S("path", { d: closedPath(blobPts(200, 200, 78, 150, 0, { amp: 3, f1: 2, f2: 6, speed: 0.8 })), fill: "none", stroke: "#3E6FD6", "stroke-width": "2.5", opacity: "0.5" });
    var label = S("path", { d: closedPath(blobPts(200, 200, 50, 120, 0, { amp: 3, f1: 2, f2: 5, speed: 0.9 })), fill: "url(#nd-l)" });
    var grp = S("g", null, [disc, g1, g2, label, S("circle", { cx: "200", cy: "200", r: "8", fill: "#F3F0E9" })]);
    var arm = S("g", null, [
      S("line", { x1: "322", y1: "86", x2: "214", y2: "182", stroke: "#2A2F3C", "stroke-width": "11", "stroke-linecap": "round" }),
      S("rect", { x: "204", y: "172", width: "22", height: "22", rx: "6", fill: "#2F6BE0", transform: "rotate(40 215 183)" }),
      S("circle", { cx: "322", cy: "86", r: "16", fill: "#3a4150" }),
      S("circle", { cx: "322", cy: "86", r: "6", fill: "#2F6BE0" })
    ]);
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [
        grad("radialGradient", "nd-g", { cx: "42%", cy: "34%", r: "82%" }, [["0%", "#222838"], ["100%", "#0B0E16"]]),
        grad("radialGradient", "nd-l", { cx: "44%", cy: "38%", r: "78%" }, [["0%", "#6FA0FF"], ["55%", "#2F6BE0"], ["100%", "#1B49B0"]])
      ]),
      grp, arm
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      grp.setAttribute("transform", "rotate(" + (t * 18 + e * 70) + " 200 200)");
      disc.setAttribute("d", closedPath(blobPts(200, 200, 134, 170, t, { amp: 4 * (1 + e * 2), f1: 2, f2: 4, speed: 0.55 })));
      g1.setAttribute("d", closedPath(blobPts(200, 200, 106, 150, t * 0.9, { amp: 3 * (1 + e * 2), f1: 3, f2: 5, speed: 0.7 })));
      g2.setAttribute("d", closedPath(blobPts(200, 200, 78, 150, t * 1.05, { amp: 3 * (1 + e * 2), f1: 2, f2: 6, speed: 0.8 })));
      label.setAttribute("d", closedPath(blobPts(200, 200, 50, 120, t * 1.2, { amp: 3 * (1 + e * 2.5), f1: 2, f2: 5, speed: 0.9 })));
      arm.setAttribute("transform", "rotate(" + (4 + Math.sin(t * 0.7) * 3 - e * 6) + " 322 86)");
    });
    return svg;
  }

  /* ---- 4. Vantage Prep — abstract: organic navy blob + rounded gold "VP" ---- */
  function BlobVantage() {
    var k = kick("vantage");
    var body = S("path", { d: closedPath(blobPts(200, 202, 126, 200, 0, { amp: 6, f1: 2, f2: 3, speed: 0.5, squashY: 1.04 })), fill: "url(#vp-g)" });
    var vp = S("text", {
      x: "200", y: "228", "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": "'Fredoka', ui-sans-serif, system-ui, sans-serif", "font-weight": "700", "font-size": "150",
      "letter-spacing": "-12", fill: "url(#vp-c)"
    });
    vp.textContent = "VP";
    var grp = S("g", null, [vp]);
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [
        grad("radialGradient", "vp-g", { cx: "42%", cy: "28%", r: "86%" }, [["0%", "#34427F"], ["60%", "#1B2860"], ["100%", "#0E1740"]]),
        grad("linearGradient", "vp-c", { x1: "0", y1: "0", x2: "0", y2: "1" }, [["0%", "#F7E09A"], ["48%", "#DFAF45"], ["100%", "#A9791F"]])
      ]),
      body, grp
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      body.setAttribute("d", closedPath(blobPts(200, 202, 126, 200, t, { amp: 6 * (1 + e * 1.6), f1: 2, f2: 3, speed: 0.5, squashY: 1.04 })));
      var bob = Math.sin(t * 0.9) * 3 - e * 12;
      var s = 1 + Math.sin(t * 1.2) * 0.03 + e * 0.09;
      vp.setAttribute("transform", "translate(200 " + (228 + bob).toFixed(1) + ") scale(" + s.toFixed(3) + ") translate(-200 -228)");
      grp.setAttribute("transform", "rotate(" + (Math.sin(t * 0.4) * 1.6).toFixed(2) + " 200 200)");
    });
    return svg;
  }

  /* ---- 5. Pitstop — black map pin, yellow glow ---- */
  function BlobPitstop() {
    var k = kick("pitstop");
    function tailD(t, e) {
      var py = 320 + Math.sin(t * 0.8) * 4 + e * 16;
      var lx = 150 + Math.sin(t * 0.6) * 3, rx2 = 250 - Math.sin(t * 0.6 + 1) * 3;
      return "M " + lx.toFixed(1) + " 198 Q 193 262 200 " + py.toFixed(1) + " Q 207 262 " + rx2.toFixed(1) + " 198 Q 200 238 " + lx.toFixed(1) + " 198 Z";
    }
    var glow = S("circle", { cx: "200", cy: "190", r: "165", fill: "url(#pp-y)", opacity: "0.5" });
    var head = S("path", { d: closedPath(blobPts(200, 150, 88, 140, 0, { amp: 4, f1: 2, f2: 5, speed: 0.7 })) });
    var tail = S("path", { d: "M 150 198 Q 193 262 200 320 Q 207 262 250 198 Q 200 238 150 198 Z" });
    var hole = S("path", { d: closedPath(blobPts(200, 146, 34, 90, 0, { amp: 2.5, f1: 2, f2: 4, speed: 0.9 })), fill: "#F3F0E9" });
    var pinShape = S("g", { filter: "url(#pp-goo)", fill: "url(#pp-k)" }, [head, tail]);
    var grp = S("g", null, [pinShape, hole]);
    var goo = S("filter", { id: "pp-goo", x: "-20%", y: "-20%", width: "140%", height: "140%" }, [
      S("feGaussianBlur", { "in": "SourceGraphic", stdDeviation: "9", result: "b" }),
      S("feColorMatrix", { "in": "b", mode: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" })
    ]);
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [
        grad("radialGradient", "pp-y", { cx: "50%", cy: "50%", r: "50%" }, [["0%", "#FFD84D", "0.85"], ["55%", "#FFD84D", "0.35"], ["100%", "#FFD84D", "0"]]),
        grad("radialGradient", "pp-k", { cx: "40%", cy: "30%", r: "80%" }, [["0%", "#3a3a3a"], ["100%", "#050505"]]),
        goo
      ]),
      glow, grp
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      var dy = Math.sin(t * 0.8) * 5 - e * 24;
      grp.setAttribute("transform", "translate(0 " + dy.toFixed(1) + ") rotate(" + (Math.sin(t * 0.45) * 2).toFixed(2) + " 200 200)");
      head.setAttribute("d", closedPath(blobPts(200, 150, 88 * (1 + e * 0.07), 140, t, { amp: 4 * (1 + e * 2), f1: 2, f2: 5, speed: 0.7 })));
      tail.setAttribute("d", tailD(t, e));
      hole.setAttribute("d", closedPath(blobPts(200, 146, 34, 90, t * 1.2, { amp: 2.5 * (1 + e * 2), f1: 2, f2: 4, speed: 0.9 })));
      glow.setAttribute("opacity", (0.5 + Math.sin(t * 1.1) * 0.12 + e * 0.35).toFixed(3));
    });
    return svg;
  }

  /* ---- 6. Genre-Space — organic blob music note (violet) ---- */
  function BlobGenreSpace() {
    var k = kick("genrespace");
    var STEM_X = 216, STEM_TOP = 98, HEAD_CX = 158, HEAD_CY = 258, HEAD_R = 64;
    var stem = S("rect", { x: (STEM_X - 9), y: STEM_TOP, width: "18", height: (HEAD_CY - STEM_TOP), rx: "9", fill: "url(#gs-g)" });
    var flag = S("path", { d: "M 225 102 C 266 120 286 156 264 202 C 262 166 248 142 225 150 Z", fill: "url(#gs-g)" });
    var head = S("path", { d: closedPath(blobPts(HEAD_CX, HEAD_CY, HEAD_R, 130, 0, { amp: 5, f1: 2, f2: 4, speed: 0.7, squashY: 0.82 })), fill: "url(#gs-g)" });
    var grp = S("g", null, [stem, flag, head]);
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [
        grad("radialGradient", "gs-g", { cx: "42%", cy: "30%", r: "84%" }, [["0%", "#B49CFF"], ["52%", "#7C5CF0"], ["100%", "#4A2DB0"]])
      ]),
      grp
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      var bob = Math.sin(t * 0.9) * 5 - e * 18;
      grp.setAttribute("transform", "translate(0 " + bob.toFixed(1) + ") rotate(" + (Math.sin(t * 0.5) * 2.4).toFixed(2) + " 200 210)");
      head.setAttribute("d", closedPath(blobPts(HEAD_CX, HEAD_CY, HEAD_R * (1 + e * 0.08), 130, t, { amp: 5 * (1 + e * 2), f1: 2, f2: 4, speed: 0.7, squashY: 0.82 })));
    });
    return svg;
  }

  /* ---- 7. AK Labs — alive black organic blob with "AK" knocked out ---- */
  function BlobAKLabs() {
    var k = kick("aklabs");
    var N = 132;
    function P(t, e) {
      return closedPath(blobPts(200, 200, 150 + e * 10 + Math.sin(t * 0.8) * 3, N, t,
        { amp: 12 * (1 + e * 1.8), f1: 2, f2: 5, speed: 0.85 }));
    }
    var d0 = P(0, 0);
    var blob = S("path", { d: d0, fill: "url(#ak-g)", mask: "url(#ak-mask)" });
    var maskBlob = S("path", { d: d0, fill: "#fff" });
    var maskText = S("text", {
      x: "200", y: "204", "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": "'AK Wordmark','Bricolage Grotesque',sans-serif",
      "font-size": "168", "letter-spacing": "-3", fill: "#000"
    }, "AK");
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [
        grad("radialGradient", "ak-g", { cx: "40%", cy: "30%", r: "84%" }, [["0%", "#3a3a3a"], ["58%", "#141414"], ["100%", "#050505"]]),
        S("mask", { id: "ak-mask" }, [maskBlob, maskText])
      ]),
      blob
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      var d = P(t, e);
      blob.setAttribute("d", d);
      maskBlob.setAttribute("d", d);
    });
    return svg;
  }

  /* ---- Pairyx — the P monogram rebuilt as two living gold strokes: a rounded
     loop + an inner diagonal accent, both breathing/wobbling like the others ---- */
  function BlobPairyx() {
    var k = kick("pairyx");
    // centerline anchors (viewBox 0..400) — the big rounded P-loop that encloses
    // the counter and drops to a short foot bottom-left
    // the P itself, drawn as one open stroke: a left stem (foot → up the spine) that
    // arcs into a bowl across the top and right, then closes back onto the stem mid-height
    var loop = [[104, 300], [90, 244], [84, 184], [84, 120], [92, 70], [130, 52], [246, 52], [306, 68], [328, 116], [324, 170], [300, 214], [240, 234], [150, 230], [100, 212]];
    // inner accent — the logo's signature flourish: a short top bar bending into a
    // diagonal that runs down toward the foot
    var accent = [[146, 146], [226, 146], [258, 146], [186, 212], [118, 274]];
    function wob(pts, t, e) {
      var out = [];
      for (var i = 0; i < pts.length; i++) {
        var dx = Math.sin(t * 0.85 + i * 0.7) * (2 + e * 9);
        var dy = Math.cos(t * 0.72 + i * 0.95) * (2 + e * 9);
        out.push([pts[i][0] + dx, pts[i][1] + dy]);
      }
      return out;
    }
    function openPath(pts) {
      var n = pts.length;
      var d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1) + " ";
      for (var i = 0; i < n - 1; i++) {
        var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += "C " + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) +
          " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1) + " ";
      }
      return d;
    }
    var SW = "34";
    var s1 = S("path", { d: openPath(loop), fill: "none", stroke: "url(#px-g)", "stroke-width": SW, "stroke-linecap": "round", "stroke-linejoin": "round" });
    var s2 = S("path", { d: openPath(accent), fill: "none", stroke: "url(#px-g)", "stroke-width": SW, "stroke-linecap": "round", "stroke-linejoin": "round" });
    var svg = S("svg", { viewBox: "0 0 400 400", "class": "logo-svg" }, [
      S("defs", null, [
        grad("linearGradient", "px-g", { x1: "8%", y1: "0%", x2: "92%", y2: "100%" },
          [["0%", "#F6D98A"], ["38%", "#E0B45C"], ["70%", "#C9A24A"], ["100%", "#A0742A"]])
      ]),
      s1, s2
    ]);
    raf(function (t) {
      k.imp *= 0.975;
      var e = k.imp;
      s1.setAttribute("d", openPath(wob(loop, t, e)));
      s2.setAttribute("d", openPath(wob(accent, t * 1.04, e)));
    });
    return svg;
  }

  /* ---- project data ---- */
  var PROJECTS = [
    { key: "pairyx", Comp: BlobPairyx, color: "#C9A24A", url: "https://pairyx.co/",
      wm: { text: "PAIRYX", flipA: true, font: "'Quicksand', sans-serif", color: "#C49A3D", size: "6.6vmin", ls: "0.16em", weight: 600 } },
    { key: "playback", Comp: BlobPlayback, color: "#E8472A", url: "https://tryplayback.xyz",
      wm: { text: "Playback", font: "'Clash Display', sans-serif", color: "#000000", size: "5.4vmin", ls: "-0.01em", weight: 600 } },
    { key: "report", Comp: BlobReport, color: "#F2730C", url: "https://createwellness.github.io",
      wm: { text: "create report engine", font: "'Vantely', cursive", color: "#F57E25", size: "6.6vmin", ls: "0em", weight: 400 } },
    { key: "needl", Comp: BlobNeedl, color: "#2F6BE0", url: "https://useneedl.netlify.app",
      wm: { text: "Needl", font: "'Resolide Serif', serif", color: "#111827", size: "6vmin", ls: "0em", weight: 400 } },
    { key: "vantage", Comp: BlobVantage, color: "#D9A93E", url: "https://vantageprep.netlify.app",
      wm: { text: "Vantage Prep", font: "'EB Garamond Brand', serif", color: "#111827", size: "5.6vmin", ls: "0.005em", weight: 600 } },
    { key: "pitstop", Comp: BlobPitstop, color: "#F5C518", url: "https://usepitstop.netlify.app",
      wm: { text: "PITSTOP", font: "'Hobsky', sans-serif", color: "#000000", size: "9vmin", ls: "0.04em", weight: 400 } },
    { key: "genrespace", Comp: BlobGenreSpace, color: "#7C5CF0", url: "https://genre-space.netlify.app/",
      wm: { text: "genre-space", font: "'Inktera Demo', sans-serif", color: "#7C5CF0", size: "7vmin", ls: "0em", weight: 400 } },
    { key: "aklabs", Comp: BlobAKLabs, color: "#1A1A1A", url: "https://aklaboratories.github.io",
      wm: { text: "AK LABS", font: "'AK Wordmark', sans-serif", color: "#111827", size: "7.2vmin", ls: "0.02em", weight: 400 } }
  ];

  /* ---- shared interaction state ---- */
  var state = { active: 0, hovered: false, ready: true, interacted: false, mouse: { x: 0, y: 0 } };

  /* ---- organic geometry for the blob cursor ---- */
  var A_TIP = -2.356; // up-left
  function ccArrow(cx, cy, s, t, amp) {
    var NP = 24, R = 9, TIP = 10, EXP = 7;
    // offset so the nominal point lands on (cx, cy) — the real pointer hotspot
    var offx = -Math.cos(A_TIP) * (R + TIP) * s;
    var offy = -Math.sin(A_TIP) * (R + TIP) * s;
    var pts = [];
    for (var i = 0; i < NP; i++) {
      var a = (i / NP) * Math.PI * 2;
      var rb = R;
      var dd = Math.cos(a - A_TIP);
      if (dd > 0) rb += TIP * Math.pow(dd, EXP); // pull one soft spike toward up-left
      var wob = (Math.sin(a * 3 + t * 1.6) + 0.5 * Math.sin(a * 5 - t * 1.1)) * amp;
      var r = rb * s + wob;
      pts.push([cx + offx + Math.cos(a) * r, cy + offy + Math.sin(a) * r]);
    }
    return closedPath(pts);
  }

  // a small, alive black blob that stands in for the cursor.
  function CursorBlob() {
    var path = S("path", { d: "" });
    var grp = S("g", null, [path]);
    var box = H("div", { "class": "cursor" }, [S("svg", { viewBox: "0 0 80 80" }, [grp])]);
    var C = 40, Sc = 0.9; // Sc scales the arrow — a little smaller
    var pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var tgt = { x: pos.x, y: pos.y };
    var hot = 0, hotT = 0, press = 0, pressT = 0, kickv = 0;

    window.addEventListener("mousemove", function (e) { tgt.x = e.clientX; tgt.y = e.clientY; });
    window.addEventListener("mousedown", function () { pressT = 1; });
    window.addEventListener("mouseup", function () { pressT = 0; });
    window.addEventListener("cursor-hot", function (e) { hotT = e.detail ? 1 : 0; });
    window.addEventListener("cursor-fx", function (e) {
      var d = e.detail || {};
      if (d.type === "scroll") kickv = 1;
      if (d.type === "click") kickv = Math.max(kickv, 0.8);
    });

    raf(function (t) {
      // slow, smooth follow
      pos.x += (tgt.x - pos.x) * 0.14;
      pos.y += (tgt.y - pos.y) * 0.14;
      hot += (hotT - hot) * 0.10;
      press += (pressT - press) * 0.22;
      kickv *= 0.92;
      // livelier wobble + a soft breathing pulse so it feels alive (no growth)
      var amp = 1.1 + hot * 0.7 + kickv * 1.8;
      var breathe = 1 + Math.sin(t * 1.3) * 0.06;
      path.setAttribute("d", ccArrow(C, C, Sc * breathe, t, amp));
      // only a gentle squish on press (anchored at the tip) — no scaling up
      var sx = 1 + press * 0.10;
      var sy = 1 - press * 0.16;
      grp.setAttribute("transform", "translate(" + C + " " + C + ") scale(" + sx.toFixed(3) + " " + sy.toFixed(3) + ") translate(" + (-C) + " " + (-C) + ")");
      box.style.transform = "translate(" + (pos.x - C).toFixed(1) + "px, " + (pos.y - C).toFixed(1) + "px)";
    });
    return box;
  }

  /* ---- brand wordmark revealed under the active logo on hover ---- */
  function Wordmark() {
    var box = H("div", { "class": "wordmark" });
    var letters = [];
    var displayKey = PROJECTS[state.active].key;
    var prog = 0, last = 0;

    function build() {
      var wm = (find(displayKey) || PROJECTS[0]).wm;
      box.style.fontFamily = wm.font;
      box.style.fontWeight = wm.weight;
      box.style.fontSize = wm.size;
      box.style.letterSpacing = wm.ls;
      box.style.color = wm.color;
      box.style.webkitTextStroke = wm.stroke || "0px transparent";
      box.style.paintOrder = "stroke";
      while (box.firstChild) box.removeChild(box.firstChild);
      letters = [];
      // image wordmark (a custom logotype we don't have as a webfont) — revealed as one piece
      if (wm.img) {
        box.style.fontFamily = ""; box.style.color = ""; box.style.webkitTextStroke = "";
        var img = H("img", { "class": "ch", src: wm.img, alt: wm.text || "" });
        img.style.height = wm.size || "5.6vmin";
        img.style.width = "auto";
        box.appendChild(img);
        letters.push(img);
        return;
      }
      var chars = wm.text.split("");
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        var span = H("span", { "class": "ch" });
        // render "A" as an upside-down uppercase V (a chevron peak), like the brand wordmark
        if (wm.flipA && (ch === "A" || ch === "a")) {
          // letter-spacing 0 on the inner span: otherwise the V's trailing letter-spacing
          // rides along the 180° rotation and lands on the LEFT, opening a gap before the ∧
          var v = H("span", null, ["V"]); v.style.display = "inline-block"; v.style.letterSpacing = "0"; v.style.transform = "rotate(180deg)"; span.appendChild(v);
        } else {
          span.appendChild(document.createTextNode(ch === " " ? "\u00a0" : ch));
        }
        box.appendChild(span);
        letters.push(span);
      }
    }
    function find(key) { for (var i = 0; i < PROJECTS.length; i++) if (PROJECTS[i].key === key) return PROJECTS[i]; return null; }
    build();

    raf(function (t) {
      var dt = Math.min(0.05, t - last); last = t;
      var activeKey = PROJECTS[state.active].key;
      var reveal = state.hovered && state.ready;
      var onActive = displayKey === activeKey;
      var target = (reveal && onActive) ? 1 : 0;
      var DUR = target > prog ? 0.9 : 0.7; // a touch quicker, still organic
      var step = dt / DUR;
      if (prog < target) prog = Math.min(target, prog + step);
      else if (prog > target) prog = Math.max(target, prog - step);
      var gp = prog;
      var n = letters.length;
      var STAG = Math.min(0.06, 0.72 / Math.max(1, n));
      var span = Math.max(0.18, 1 - (n - 1) * STAG);
      for (var i = 0; i < n; i++) {
        var el = letters[i]; if (!el) continue;
        var local = (gp - i * STAG) / span;
        local = local < 0 ? 0 : local > 1 ? 1 : local;
        var e = local * local * (3 - 2 * local); // smoothstep ease
        var ty = (1 - e) * 18 + Math.sin(t * 1.25 + i * 0.5) * 1.5 * e;
        var sc = 0.84 + e * 0.16;
        var rot = (1 - e) * -4 + Math.sin(t * 0.9 + i * 0.7) * 1.2 * e;
        el.style.opacity = e.toFixed(3);
        el.style.transform = "translateY(" + ty.toFixed(2) + "px) scale(" + sc.toFixed(3) + ") rotate(" + rot.toFixed(2) + "deg)";
        el.style.filter = "blur(" + ((1 - e) * 8).toFixed(2) + "px)";
      }
      var m = state.mouse;
      var ox = m.x * 10;
      var oy = m.y * 8 + Math.sin(t * 0.85) * 2 * gp;
      box.style.transform = "translate(-50%, calc(-50% + 21vmin)) translate(" + ox.toFixed(1) + "px, " + oy.toFixed(1) + "px)";
      // once the old word has fully retracted, adopt the new project's wordmark
      if (gp < 0.02 && displayKey !== activeKey) { displayKey = activeKey; build(); }
    });
    return box;
  }

  /* ---- corner signature — the goo IS the letters: "projects" is permanently
     spelled out, while "by arjun kalbag" rests as a blob that slowly oozes open
     on hover. Glyphs are placed at their real proportional positions (measured
     from the font) so the revealed state kerns like a true word. ---- */
  var CB_TEXT = "projects by arjun kalbag";
  var CB_CHARS = CB_TEXT.split("");
  var CB_TITLE_END = 9; // "projects " (0..8) forms the left title
  var CB_GROUP = CB_CHARS.map(function (_, i) { return i < CB_TITLE_END ? 0 : 1; });
  var CB_GI = [];
  var CB_GN = [0, 0];
  CB_GROUP.forEach(function (g, i) { CB_GI[i] = CB_GN[g]; CB_GN[g]++; });

  function CornerBlob() {
    // bar coordinate space is sized 1 user-unit = 1 CSS px (viewBox tracks the
    // container each frame), so positions/sizes below are in pixels.
    var BASE = 66, FS = 56, LEFT = 28, RIGHT_PAD = 26;
    var fontProps = { "font-family": "'Fredoka', ui-sans-serif, system-ui, sans-serif", "font-weight": "600", "font-size": String(FS) };
    var letters = [];
    var layout = null; // {nat:[x..], W} once measured
    var h = 0, tgt = 0;

    var measure = S("text", merge({ x: "0", y: String(BASE), "text-anchor": "start" }, fontProps));
    measure.style.visibility = "hidden";
    measure.style.pointerEvents = "none";
    measure.textContent = CB_TEXT;

    var glyphG = S("g", merge({ filter: "url(#cb-goo)", fill: "#16130F" }, fontProps));
    for (var i = 0; i < CB_CHARS.length; i++) {
      var tx = S("text", { x: "0", y: "0", "text-anchor": "middle" });
      tx.style.whiteSpace = "pre";
      tx.textContent = CB_CHARS[i] === " " ? " " : CB_CHARS[i];
      glyphG.appendChild(tx);
      letters.push(tx);
    }

    var defs = S("defs", null, [
      S("filter", { id: "cb-goo", x: "-40%", y: "-40%", width: "180%", height: "180%" }, [
        S("feGaussianBlur", { "in": "SourceGraphic", stdDeviation: "3.6", result: "b" }),
        S("feColorMatrix", { "in": "b", mode: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" })
      ])
    ]);

    var svg = S("svg", null, [defs, measure, glyphG]);
    svg.style.cssText = "width:100%;height:100%;overflow:visible;display:block";

    var wrap = H("div", { "class": "corner" }, [svg]);
    // only the top-right hotspot reacts (the user hovers the blob); the whole
    // expanded phrase docks within it so a held hover keeps reading
    var hit = H("div", { "class": "sig-hit" });
    hit.addEventListener("mouseenter", function () { tgt = 1; window.dispatchEvent(new CustomEvent("cursor-hot", { detail: true })); });
    hit.addEventListener("mouseleave", function () { tgt = 0; window.dispatchEvent(new CustomEvent("cursor-hot", { detail: false })); });
    hit.addEventListener("click", function (e) { e.stopPropagation(); window.open("https://arjunkalbag.xyz", "_blank", "noopener,noreferrer"); });

    // measure glyph centers from the hidden reference <text> once the font loads
    var done = false;
    function doMeasure() {
      if (done) return;
      try {
        var W = measure.getComputedTextLength();
        if (!W) return;
        var nat = CB_CHARS.map(function (_, i) {
          var s = measure.getStartPositionOfChar(i).x;
          var en = measure.getEndPositionOfChar(i).x;
          return (s + en) / 2;
        });
        layout = { nat: nat, W: W };
        done = true;
      } catch (err) { /* retry */ }
    }
    function startMeasuring() {
      doMeasure();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(doMeasure, 30); });
      var id = setInterval(function () { doMeasure(); if (done) clearInterval(id); }, 120);
      setTimeout(function () { clearInterval(id); }, 3000);
    }

    raf(function (t) {
      // size the coordinate space to the bar in CSS px (1 user unit = 1 px)
      var cw = wrap.clientWidth || window.innerWidth;
      var ch = wrap.clientHeight || 130;
      svg.setAttribute("viewBox", "0 0 " + cw + " " + ch);

      h += (tgt - h) * 0.0072; // very slow, smooth morph
      var hh = Math.max(0, Math.min(1, h));
      var m = hh * hh * (3 - 2 * hh); // smoothstep ease
      var L = layout;
      var W = L ? L.W : CB_CHARS.length * 26;
      var rightEnd = cw - RIGHT_PAD;     // phrase right edge (keeps signature in place)
      var phraseLeft = rightEnd - W;     // where the full right-aligned phrase begins
      var blobCenter = rightEnd - 34;    // signature blob rests near the right
      var n = CB_CHARS.length;
      for (var i = 0; i < n; i++) {
        var el = letters[i];
        if (!el) continue;
        var g = CB_GROUP[i], gi = CB_GI[i], gn = CB_GN[g];
        var mc = L ? L.nat[i] : i * 26;  // glyph center within the phrase
        var natX = mc + phraseLeft;      // docked slot in the right-aligned phrase
        var x, gm;
        if (g === 0) {
          // "projects" — always spelled out; rigidly slides from the top-left to
          // its docked slot on hover (staggered so it travels organically)
          gm = 1;
          var restX = LEFT + mc;         // left-aligned at the top-left
          var pmi = Math.max(0, Math.min(1, (m - gi * 0.02) / (1 - gn * 0.02)));
          var pme = pmi * pmi * (3 - 2 * pmi);
          x = restX + (natX - restX) * pme;
        } else {
          // "by arjun kalbag" — rests as a blob near the right, oozes open in place
          gm = m;
          var mi = Math.max(0, Math.min(1, (gm - gi * 0.012) / (1 - gn * 0.012)));
          var me = mi * mi * (3 - 2 * mi);
          var rest = blobCenter + (gi - (gn - 1) / 2) * 5 + Math.sin(t * 1.1 + gi) * 2.4;
          x = rest + (natX - rest) * me;
        }
        // alive: bob, breathe and wiggle out of phase — much more when collapsed
        var y = BASE + Math.sin(t * 1.3 + gi * 0.5) * (1.4 + (1 - gm) * 4.2) + Math.cos(t * 0.8 + gi * 1.3) * (1 - gm) * 2.4;
        var sx = 1 + Math.sin(t * 1.6 + gi * 0.8) * 0.05 + (1 - gm) * 0.04;
        var sy = 1 + Math.cos(t * 1.45 + gi * 0.6) * 0.05 + (1 - gm) * 0.08;
        var r = Math.sin(t * 0.85 + gi * 0.7) * (1.3 + (1 - gm) * 3.4);
        el.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + sx.toFixed(3) + " " + sy.toFixed(3) + ") rotate(" + r.toFixed(2) + ")");
      }
    });

    return { el: wrap, hit: hit, start: startMeasuring };
  }
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

  /* ---- app shell / carousel ---- */
  function App(root) {
    var N = PROJECTS.length;
    var stage = H("div", { "class": "stage" });

    var corner = CornerBlob();
    var glow = H("div", { "class": "glow" });
    glow.style.background = PROJECTS[state.active].color;
    glow.style.opacity = "0.22";
    var ground = H("div", { "class": "ground" });
    stage.appendChild(corner.el);
    stage.appendChild(corner.hit);
    stage.appendChild(glow);
    stage.appendChild(ground);

    // slides
    var slideEls = [];
    PROJECTS.forEach(function (p) {
      var kicker = H("div", { "class": "kicker" }, [p.Comp()]);
      var floater = H("div", { "class": "floater" }, [kicker]);
      var parallax = H("div", { "class": "parallax" }, [floater]);
      var slide = H("div", { "class": "slide" }, [parallax]);
      slide.style.pointerEvents = "none";
      stage.appendChild(slide);
      slideEls.push({ slide: slide, parallax: parallax });
    });

    // stable hover/click target over the logo
    var hotzone = H("div", { "class": "hotzone" });
    hotzone.addEventListener("mouseenter", function () { state.hovered = true; window.dispatchEvent(new CustomEvent("cursor-hot", { detail: true })); });
    hotzone.addEventListener("mouseleave", function () { state.hovered = false; window.dispatchEvent(new CustomEvent("cursor-hot", { detail: false })); });
    hotzone.addEventListener("click", onLogoClick);
    stage.appendChild(hotzone);

    stage.appendChild(Wordmark());
    stage.appendChild(CursorBlob());

    // minimal, wordless scroll cue
    var dots = PROJECTS.map(function (p, i) { return H("span", { "class": "dot" + (i === state.active ? " on" : "") }); });
    var dotrow = H("div", { "class": "dotrow" }, dots);
    var chev = S("svg", { "class": "chev", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round" }, [S("path", { d: "M9 6l6 6-6 6" })]);
    var cue = H("div", { "class": "cue" }, [dotrow, chev]);
    stage.appendChild(cue);

    root.appendChild(stage);
    corner.start();

    var lock = false, accum = 0, decayTimer = null, readyTimer = null, parRaf;

    function renderSlides() {
      var active = state.active, mx = state.mouse.x, my = state.mouse.y;
      for (var i = 0; i < slideEls.length; i++) {
        var rel = i - active; rel = ((rel % N) + N) % N; if (rel > N / 2) rel -= N;
        var isActive = rel === 0, abs = Math.abs(rel), visible = abs <= 1.5;
        var slide = slideEls[i].slide, parallax = slideEls[i].parallax;
        slide.style.transform =
          "translate(-50%, -50%) translateX(" + (rel * 66) + "vw) translateZ(" + (-abs * 380) + "px) " +
          "rotateY(" + (-rel * 28) + "deg) scale(" + (isActive ? 1 : 0.62) + ")";
        slide.style.opacity = visible ? (isActive ? 1 : 0.62) : 0;
        slide.style.filter = isActive ? "none" : "saturate(0.8)";
        slide.style.zIndex = String(10 - abs);
        parallax.style.transform = isActive
          ? "translate(" + (mx * 18) + "px, " + (my * 16) + "px) rotateY(" + (mx * 9) + "deg) rotateX(" + (-my * 9) + "deg)"
          : "translate(0,0)";
        slide.classList.toggle("active", isActive);
      }
    }

    function applyActive() {
      glow.style.background = PROJECTS[state.active].color;
      for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("on", i === state.active);
      renderSlides();
      // gate the wordmark off while the logo travels, re-arm when it lands
      state.ready = false;
      clearTimeout(readyTimer);
      readyTimer = setTimeout(function () { state.ready = true; }, 1100);
    }

    function go(dir) {
      if (lock) return;
      lock = true;
      window.dispatchEvent(new CustomEvent("cursor-fx", { detail: { type: "scroll" } }));
      state.active = (state.active + dir + N) % N;
      state.interacted = true;
      cue.classList.add("hide");
      applyActive();
      setTimeout(function () { lock = false; }, 1400);
    }

    function onLogoClick() {
      var key = PROJECTS[state.active].key;
      window.dispatchEvent(new CustomEvent("blob-kick", { detail: { key: key } }));
      window.dispatchEvent(new CustomEvent("cursor-fx", { detail: { type: "click" } }));
      var kerr = document.querySelector(".slide.active .kicker");
      if (kerr) { kerr.classList.remove("kick"); void kerr.offsetWidth; kerr.classList.add("kick"); }
      var g = document.querySelector(".glow");
      if (g) { g.classList.remove("pulse"); void g.offsetWidth; g.classList.add("pulse"); }
      var url = PROJECTS[state.active].url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }

    // wheel / trackpad -> one project at a time (deliberate, slide-locked)
    window.addEventListener("wheel", function (e) {
      e.preventDefault();
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (lock) { accum = 0; return; }
      accum += d;
      clearTimeout(decayTimer);
      decayTimer = setTimeout(function () { accum = 0; }, 150);
      if (Math.abs(accum) > 110) { go(accum > 0 ? 1 : -1); accum = 0; }
    }, { passive: false });

    window.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
    });

    // touch swipe
    var sx = 0, sy = 0;
    window.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    window.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      var m = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(m) > 40) go(m < 0 ? 1 : -1);
    }, { passive: true });

    // cursor parallax (rAF-smoothed)
    window.addEventListener("mousemove", function (e) {
      state.mouse = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
      cancelAnimationFrame(parRaf);
      parRaf = requestAnimationFrame(renderSlides);
    });

    window.__goTo = function (n) { state.active = ((n % N) + N) % N; applyActive(); };
    renderSlides();
  }

  function boot() { App(document.getElementById("root")); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
