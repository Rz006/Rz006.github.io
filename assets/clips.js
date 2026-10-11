/* Animated explainer clips.
   Each <figure class="clip" data-clip="id"> becomes a short animated "video": an SVG scene,
   captions synced to the voiceover (assets/audio/<id>.mp3), a progress bar and play / sound buttons.
   Clips play silently while on screen; "Tap for sound" restarts them with the voiceover. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 800, H = 450;
  const C = { fg: '#f4f4f2', soft: '#a6a6ad', dim: '#55555c', line: '#2b2b30', panel: '#141416', gold: '#e2b65c', ok: '#8fd89b' };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  function S(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const T = (txt, attrs, parent) => { const e = S('text', Object.assign({ fill: C.fg, 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 18 }, attrs), parent); e.textContent = txt; return e; };
  const box = (x, y, w, h, parent, extra) => S('rect', Object.assign({ x, y, width: w, height: h, rx: 14, fill: C.panel, stroke: C.line, 'stroke-width': 1.5 }, extra || {}), parent);
  function hexMix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  /* ---------------- scenes: build(g, clip) returns update(p, t) ---------------- */
  const SCENES = {
    neuralNet(g) {
      const layers = [3, 5, 5, 2], xs = [110, 250, 390, 530], nodes = [], edges = [];
      layers.forEach((n, L) => { nodes[L] = []; for (let i = 0; i < n; i++) nodes[L].push({ x: xs[L], y: 225 + (i - (n - 1) / 2) * 62 }); });
      const eg = S('g', {}, g), pg = S('g', {}, g), ng = S('g', {}, g);
      for (let L = 0; L < 3; L++) nodes[L].forEach((a, i) => nodes[L + 1].forEach((b, j) => {
        edges.push({ L, a, b, k: edges.length, line: S('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: C.soft, 'stroke-width': 1.4 }, eg), dot: S('circle', { r: 3.5, fill: C.gold, opacity: 0 }, pg) });
      }));
      const circles = nodes.map(l => l.map(n => S('circle', { cx: n.x, cy: n.y, r: 12, fill: C.panel, stroke: C.soft, 'stroke-width': 2 }, ng)));
      T('input', { x: 110, y: 400, 'text-anchor': 'middle', fill: C.soft, 'font-size': 15 }, g);
      T('hidden layers', { x: 320, y: 400, 'text-anchor': 'middle', fill: C.soft, 'font-size': 15 }, g);
      T('output', { x: 530, y: 400, 'text-anchor': 'middle', fill: C.soft, 'font-size': 15 }, g);
      box(605, 120, 165, 200, g);
      T('loss', { x: 622, y: 148, fill: C.soft, 'font-size': 15 }, g);
      const lossVal = T('0.98', { x: 752, y: 148, 'text-anchor': 'end', fill: C.gold, 'font-size': 15, 'font-weight': 700 }, g);
      const poly = S('polyline', { fill: 'none', stroke: C.gold, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
      const epoch = T('epoch 0', { x: 622, y: 305, fill: C.soft, 'font-size': 14 }, g);
      const loss = (x) => 0.9 * Math.exp(-3.4 * x) + 0.07 + 0.035 * Math.sin(41 * x) * (1 - x);
      return (p, t) => {
        const phase = (t % 1.5) / 1.5;
        edges.forEach(e => {
          const w = 0.25 + 0.6 * Math.abs(Math.sin(e.k * 1.7 + p * 6));
          e.line.setAttribute('stroke-opacity', w.toFixed(2));
          const f = seg(phase, e.L / 3, (e.L + 1) / 3);
          const on = f > 0 && f < 1;
          e.dot.setAttribute('opacity', on ? 0.9 : 0);
          if (on) { e.dot.setAttribute('cx', lerp(e.a.x, e.b.x, f)); e.dot.setAttribute('cy', lerp(e.a.y, e.b.y, f)); }
        });
        circles.forEach((l, L) => l.forEach(c => { const lit = Math.abs(phase - L / 3) < 0.07; c.setAttribute('fill', lit ? C.gold : C.panel); }));
        const n = 40, pts = [], up = seg(p, 0.03, 0.92);
        for (let i = 0; i <= n * up; i++) { const x = i / n; pts.push(`${622 + x * 135},${300 - loss(x) * 130}`); }
        poly.setAttribute('points', pts.join(' '));
        lossVal.textContent = loss(up).toFixed(2);
        epoch.textContent = 'epoch ' + Math.floor(up * 500);
      };
    },

    agentLoop(g) {
      const cx = 290, cy = 240, R = 130;
      box(40, 34, 300, 56, g);
      T('Goal: find a cheap flight to Tokyo', { x: 58, y: 68, 'font-size': 16 }, g);
      S('circle', { cx, cy, r: R, fill: 'none', stroke: C.line, 'stroke-width': 3, 'stroke-dasharray': '6 8' }, g);
      const names = ['Think', 'Act', 'Observe'], angs = [-90, 30, 150];
      const nodes = angs.map((a, i) => {
        const x = cx + R * Math.cos(a * Math.PI / 180), y = cy + R * Math.sin(a * Math.PI / 180);
        const r = box(x - 58, y - 24, 116, 48, g, { rx: 24 });
        T(names[i], { x, y: y + 6, 'text-anchor': 'middle', 'font-weight': 600 }, g);
        return r;
      });
      const dot = S('circle', { r: 9, fill: C.gold }, g);
      const tools = ['web_search()', 'run_code()', 'compare_prices()'];
      T('tools', { x: 560, y: 118, fill: C.soft, 'font-size': 15 }, g);
      const chips = tools.map((tl, i) => { const r = box(560, 132 + i * 58, 200, 44, g, { rx: 22 }); T(tl, { x: 580, y: 160 + i * 58, 'font-family': 'ui-monospace, Consolas, monospace', 'font-size': 16 }, g); return r; });
      const ans = S('g', { opacity: 0 }, g);
      box(520, 330, 250, 70, ans, { stroke: C.gold });
      T('Answer', { x: 540, y: 358, fill: C.gold, 'font-size': 14, 'font-weight': 700 }, ans);
      T('Tue 14th, £412 return', { x: 540, y: 384, 'font-size': 17 }, ans);
      return (p) => {
        const loops = 2.6, lp = seg(p, 0.06, 0.8) * loops;
        const a = (-90 + (lp % 1) * 360) * Math.PI / 180;
        dot.setAttribute('cx', cx + R * Math.cos(a)); dot.setAttribute('cy', cy + R * Math.sin(a));
        const deg = ((lp % 1) * 360 + 360) % 360, active = deg < 120 ? 0 : deg < 240 ? 1 : 2;
        nodes.forEach((n, i) => n.setAttribute('stroke', i === active && p < 0.8 ? C.gold : C.line));
        const k = Math.floor(lp);
        chips.forEach((c, i) => c.setAttribute('stroke', active === 1 && k === i && p < 0.8 ? C.gold : C.line));
        ans.setAttribute('opacity', ease(seg(p, 0.8, 0.88)));
        dot.setAttribute('opacity', p < 0.82 ? 1 : 0);
      };
    },

    sorting(g) {
      const start = [7, 3, 9, 1, 6, 10, 2, 8, 5, 4], states = [];
      const a = start.slice(); let sw = 0, cmp = 0;
      for (let pass = 0; pass < a.length - 1; pass++) {
        for (let j = 0; j < a.length - 1 - pass; j++) {
          cmp++; const swap = a[j] > a[j + 1];
          if (swap) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; sw++; }
          states.push({ arr: a.slice(), j, done: pass, cmp, sw });
        }
      }
      const bars = start.map((v, i) => S('rect', { x: 120 + i * 58, width: 46, rx: 8 }, g));
      const labels = start.map((v, i) => T('', { x: 143 + i * 58, y: 410, 'text-anchor': 'middle', fill: C.soft, 'font-size': 16 }, g));
      const info = T('', { x: 120, y: 60, fill: C.soft, 'font-size': 17 }, g);
      return (p) => {
        const k = Math.min(states.length - 1, Math.floor(seg(p, 0.05, 0.86) * states.length));
        const s = p < 0.05 ? { arr: start, j: -5, done: -1, cmp: 0, sw: 0 } : states[k];
        const finished = p > 0.87;
        s.arr.forEach((v, i) => {
          const h = v * 28, sortedTail = finished || i >= s.arr.length - s.done;
          bars[i].setAttribute('y', 385 - h); bars[i].setAttribute('height', h);
          bars[i].setAttribute('fill', !finished && (i === s.j || i === s.j + 1) ? C.gold : sortedTail ? C.fg : C.dim);
          labels[i].textContent = v;
        });
        info.textContent = finished ? 'sorted ✓  ' + states.at(-1).cmp + ' comparisons' : `comparisons: ${s.cmp}    swaps: ${s.sw}`;
      };
    },

    gitBranch(g) {
      const MY = 190, FY = 310;
      T('main', { x: 40, y: MY - 30, fill: C.soft, 'font-size': 15 }, g);
      const ftag = T('feature', { x: 230, y: FY + 48, fill: C.gold, 'font-size': 15, opacity: 0 }, g);
      const cmd = T('', { x: 40, y: 64, 'font-family': 'ui-monospace, Consolas, monospace', 'font-size': 19, fill: C.fg }, g);
      const lines = S('g', {}, g), dots = S('g', {}, g);
      const mkLine = (d, col) => { const pth = S('path', { d, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round' }, lines); const L = pth.getTotalLength ? pth.getTotalLength() : 600; pth.style.strokeDasharray = L; pth.style.strokeDashoffset = L; return { pth, L }; };
      const mainA = mkLine(`M60 ${MY} H 420`, C.soft), feat = mkLine(`M220 ${MY} C 260 ${MY}, 260 ${FY}, 320 ${FY} H 520`, C.gold);
      const merge = mkLine(`M520 ${FY} C 580 ${FY}, 580 ${MY}, 640 ${MY}`, C.gold), mainB = mkLine(`M420 ${MY} H 740`, C.soft);
      const commits = [[120, MY, 0.04], [220, MY, 0.12], [320, FY, 0.28], [420, FY, 0.37], [400, MY, 0.44], [520, FY, 0.5], [640, MY, 0.64], [740, MY, 0.78]]
        .map(([x, y, at], i) => ({ at, c: S('circle', { cx: x, cy: y, r: 13, fill: C.panel, stroke: i === 6 ? C.gold : y === FY ? C.gold : C.fg, 'stroke-width': 3.5, opacity: 0 }, dots) }));
      const cmds = [[0.0, 'git commit -m "first page"'], [0.18, 'git switch -c feature'], [0.26, 'git commit -m "add guides"'], [0.42, '(a teammate pushes to main)'], [0.58, 'git switch main && git merge feature'], [0.75, 'git commit -m "ship it"']];
      const head = T('HEAD', { 'text-anchor': 'middle', fill: C.gold, 'font-size': 14, 'font-weight': 700 }, g);
      const draw = (l, a, b, p) => { l.pth.style.strokeDashoffset = l.L * (1 - ease(seg(p, a, b))); };
      return (p) => {
        draw(mainA, 0.02, 0.44, p); draw(feat, 0.2, 0.5, p); draw(merge, 0.58, 0.64, p); draw(mainB, 0.44, 0.78, p);
        ftag.setAttribute('opacity', seg(p, 0.2, 0.26));
        let last = commits[0];
        commits.forEach(c => { const o = ease(seg(p, c.at, c.at + 0.04)); c.c.setAttribute('opacity', o); if (p >= c.at) last = c; });
        head.setAttribute('x', last.c.getAttribute('cx')); head.setAttribute('y', +last.c.getAttribute('cy') - 24);
        let cur = cmds[0][1]; cmds.forEach(([at, s]) => { if (p >= at) cur = s; });
        cmd.textContent = (cur.startsWith('(') ? '' : '$ ') + cur;
      };
    },

    convolution(g) {
      const N = 8, cs = 30, ix = 60, iy = 110, img = [], K = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
      for (let r = 0; r < N; r++) { img.push([]); for (let c = 0; c < N; c++) img[r].push(c < 4 ? 0.12 : 0.9); }
      T('image', { x: ix, y: iy - 16, fill: C.soft, 'font-size': 15 }, g);
      img.forEach((row, r) => row.forEach((v, c) => S('rect', { x: ix + c * cs, y: iy + r * cs, width: cs - 2, height: cs - 2, rx: 3, fill: hexMix('#0e0e10', '#f4f4f2', v) }, g)));
      const kr = S('rect', { width: cs * 3 - 2, height: cs * 3 - 2, rx: 5, fill: 'rgba(226,182,92,0.15)', stroke: C.gold, 'stroke-width': 3 }, g);
      T('kernel', { x: 345, y: 170, fill: C.soft, 'font-size': 15 }, g);
      K.forEach((row, r) => row.forEach((v, c) => { box(340 + c * 34, 182 + r * 34, 30, 30, g, { rx: 5 }); T(String(v), { x: 355 + c * 34, y: 203 + r * 34, 'text-anchor': 'middle', 'font-size': 15, fill: v ? C.gold : C.soft }, g); }));
      const O = 6, ox = 520, oy = 140, outs = [];
      T('feature map (edges)', { x: ox, y: oy - 16, fill: C.soft, 'font-size': 15 }, g);
      const vals = [];
      for (let r = 0; r < O; r++) for (let c = 0; c < O; c++) {
        let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += img[r + i][c + j] * K[i][j];
        vals.push(Math.abs(s) / 2.34);
        outs.push(S('rect', { x: ox + c * cs, y: oy + r * cs, width: cs - 2, height: cs - 2, rx: 3, fill: C.panel, stroke: C.line }, g));
      }
      return (p) => {
        const k = Math.min(35, Math.floor(seg(p, 0.08, 0.86) * 36)), r = Math.floor(k / O), c = k % O;
        kr.setAttribute('x', ix + c * cs - 1); kr.setAttribute('y', iy + r * cs - 1);
        kr.setAttribute('opacity', p < 0.9 ? 1 : 0);
        outs.forEach((o, i) => {
          const shown = i < k || (i === k && p > 0.08) || p > 0.86;
          o.setAttribute('fill', shown ? hexMix('#141416', '#e2b65c', vals[i]) : C.panel);
          o.setAttribute('stroke', i === k && p < 0.86 ? C.fg : C.line);
        });
      };
    },

    nextToken(g) {
      const words = ['The', 'cat', 'sat', 'on', 'the'], boxes = [];
      let x = 70;
      words.forEach(w => { const wd = 34 + w.length * 13; boxes.push({ x, w: wd, g: S('g', { opacity: 0 }, g), word: w }); x += wd + 14; });
      boxes.forEach(b => { box(b.x, 130, b.w, 50, b.g, { rx: 12 }); T(b.word, { x: b.x + b.w / 2, y: 162, 'text-anchor': 'middle', 'font-size': 20 }, b.g); });
      const newTok = S('g', { opacity: 0 }, g);
      box(x, 130, 82, 50, newTok, { rx: 12, stroke: C.gold, 'stroke-width': 2.5 });
      T('mat', { x: x + 41, y: 162, 'text-anchor': 'middle', 'font-size': 20, fill: C.gold, 'font-weight': 700 }, newTok);
      const last = boxes[4], wts = [0.5, 3.5, 2.6, 1.2];
      const arcs = boxes.slice(0, 4).map((b, i) => {
        const x1 = last.x + last.w / 2, x2 = b.x + b.w / 2, h = 30 + (x1 - x2) * 0.22;
        return S('path', { d: `M${x1} 128 Q ${(x1 + x2) / 2} ${128 - h} ${x2} 128`, fill: 'none', stroke: C.gold, 'stroke-width': wts[i] * 1.6, opacity: 0, 'stroke-linecap': 'round' }, g);
      });
      const attnLbl = T('attention: which earlier words matter?', { x: 70, y: 60, fill: C.soft, 'font-size': 16, opacity: 0 }, g);
      const cands = [['mat', 0.62], ['floor', 0.21], ['sofa', 0.09], ['moon', 0.02]];
      const pl = T('next-token probabilities', { x: 70, y: 232, fill: C.soft, 'font-size': 16, opacity: 0 }, g);
      const bars = cands.map(([w, pr], i) => {
        const y = 252 + i * 44;
        T(w, { x: 70, y: y + 24, 'font-size': 18 }, g);
        S('rect', { x: 160, y: y + 6, width: 460, height: 26, rx: 13, fill: C.panel, stroke: C.line }, g);
        const bar = S('rect', { x: 160, y: y + 6, width: 0, height: 26, rx: 13, fill: i === 0 ? C.gold : C.dim }, g);
        const pct = T('', { x: 640, y: y + 25, 'font-size': 16, fill: i === 0 ? C.gold : C.soft }, g);
        return { bar, pct, pr };
      });
      return (p) => {
        boxes.forEach((b, i) => b.g.setAttribute('opacity', ease(seg(p, 0.02 + i * 0.035, 0.06 + i * 0.035))));
        attnLbl.setAttribute('opacity', seg(p, 0.22, 0.27));
        arcs.forEach((a, i) => a.setAttribute('opacity', 0.85 * ease(seg(p, 0.24 + i * 0.04, 0.3 + i * 0.04))));
        pl.setAttribute('opacity', seg(p, 0.45, 0.5));
        bars.forEach((b, i) => { const f = ease(seg(p, 0.48 + i * 0.03, 0.62 + i * 0.03)); b.bar.setAttribute('width', Math.max(0, 460 * b.pr * f)); b.pct.textContent = f > 0 ? Math.round(b.pr * 100 * f) + '%' : ''; });
        const k = ease(seg(p, 0.7, 0.8));
        newTok.setAttribute('opacity', k); newTok.setAttribute('transform', `translate(0 ${(1 - k) * 120})`);
      };
    },

    terminal(g, clip) {
      box(40, 30, 720, 390, g, { rx: 18, fill: '#0c0c0e' });
      ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => S('circle', { cx: 70 + i * 24, cy: 58, r: 7, fill: c }, g));
      const lines = clip.lines || [], rows = [];
      let w = 0; const weights = lines.map(l => { const cmdLine = /^[$>]/.test(l); const v = cmdLine ? 0.4 + l.length * 0.045 : 0.45; w += v; return { cmdLine, v }; });
      let acc = 0;
      lines.forEach((l, i) => {
        const s = 0.04 + 0.84 * acc / w; acc += weights[i].v; const e = 0.04 + 0.84 * acc / w;
        const t = T('', { x: 70, y: 110 + i * 34, 'font-family': 'ui-monospace, Consolas, monospace', 'font-size': 18, fill: weights[i].cmdLine ? C.fg : C.soft }, g);
        rows.push({ l, s, e, t, cmd: weights[i].cmdLine });
      });
      const cursor = S('rect', { width: 10, height: 22, fill: C.gold }, g);
      return (p, t) => {
        let cx = 70, cy = 110;
        rows.forEach((r, i) => {
          const f = seg(p, r.s, r.e);
          const n = r.cmd ? Math.floor(r.l.length * Math.min(1, f * 1.25)) : (f > 0 ? r.l.length : 0);
          r.t.textContent = r.l.slice(0, n);
          if (f > 0) { cy = 110 + i * 34; cx = 70 + n * 10.85; }
        });
        cursor.setAttribute('x', cx + 2); cursor.setAttribute('y', cy - 17);
        cursor.setAttribute('opacity', Math.floor(t * 2.2) % 2 ? 0.2 : 1);
      };
    },

    learningPath(g, clip) {
      const steps = clip.steps || [], pts = [[90, 330], [210, 180], [345, 310], [480, 165], [615, 300], [735, 160]];
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` C ${x0 + 60} ${y0}, ${x1 - 60} ${y1}, ${x1} ${y1}`; }
      S('path', { d, fill: 'none', stroke: C.line, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
      const prog = S('path', { d, fill: 'none', stroke: C.gold, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
      const L = prog.getTotalLength ? prog.getTotalLength() : 1200; prog.style.strokeDasharray = L;
      const ms = pts.map(([x, y], i) => {
        const c = S('circle', { cx: x, cy: y, r: 16, fill: C.panel, stroke: C.dim, 'stroke-width': 3 }, g);
        const n = T(String(i + 1), { x, y: y + 6, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: C.soft }, g);
        const above = y < 250;
        const lab = T(steps[i] || '', { x, y: above ? y - 30 : y + 44, 'text-anchor': 'middle', 'font-size': 17, fill: C.soft }, g);
        return { c, n, lab };
      });
      const dot = S('circle', { r: 9, fill: C.gold }, g);
      const counter = T('', { x: 40, y: 50, fill: C.soft, 'font-size': 16 }, g);
      return (p) => {
        const f = seg(p, 0.05, 0.85);
        prog.style.strokeDashoffset = L * (1 - f);
        const pt = prog.getPointAtLength ? prog.getPointAtLength(L * f) : { x: 0, y: 0 };
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        let reached = 0;
        ms.forEach((m, i) => { const on = f >= i / (pts.length - 1) - 0.01; if (on) reached = i + 1; m.c.setAttribute('stroke', on ? C.gold : C.dim); m.c.setAttribute('fill', on ? C.gold : C.panel); m.n.setAttribute('fill', on ? '#141416' : C.soft); m.lab.setAttribute('fill', on ? C.fg : C.soft); });
        counter.textContent = `step ${Math.max(1, reached)} of ${pts.length}`;
      };
    },

    systemDesign(g) {
      const users = [0, 1, 2, 3, 4].map(i => ({ x: 70, y: 115 + i * 55 }));
      const parts = [];
      const ug = S('g', {}, g); users.forEach(u => { S('circle', { cx: u.x, cy: u.y - 8, r: 9, fill: C.soft }, ug); S('path', { d: `M${u.x - 15} ${u.y + 16} Q ${u.x} ${u.y - 4} ${u.x + 15} ${u.y + 16}`, fill: C.soft }, ug); });
      T('users', { x: 70, y: 410, 'text-anchor': 'middle', fill: C.soft, 'font-size': 15 }, ug); parts.push([ug, 0.0]);
      const lb = S('g', {}, g); box(170, 195, 120, 60, lb); T('load', { x: 230, y: 221, 'text-anchor': 'middle', 'font-size': 15 }, lb); T('balancer', { x: 230, y: 241, 'text-anchor': 'middle', 'font-size': 15 }, lb); parts.push([lb, 0.06]);
      const servers = [0, 1, 2].map(i => { const sg = S('g', {}, g), y = 105 + i * 110; box(370, y, 120, 64, sg); T('server ' + (i + 1), { x: 430, y: y + 28, 'text-anchor': 'middle', 'font-size': 15 }, sg); S('rect', { x: 386, y: y + 40, width: 88, height: 8, rx: 4, fill: C.line }, sg); const bar = S('rect', { x: 386, y: y + 40, width: 30, height: 8, rx: 4, fill: C.gold }, sg); parts.push([sg, 0.1 + i * 0.03]); return { y: y + 32, bar }; });
      const cg = S('g', {}, g); box(600, 120, 140, 60, cg, { stroke: C.gold }); T('cache (fast)', { x: 670, y: 156, 'text-anchor': 'middle', 'font-size': 15, fill: C.gold }, cg); parts.push([cg, 0.2]);
      const dg = S('g', {}, g); S('ellipse', { cx: 670, cy: 290, rx: 60, ry: 14, fill: C.panel, stroke: C.soft, 'stroke-width': 1.5 }, dg); S('path', { d: 'M610 290 V 340 A 60 14 0 0 0 730 340 V 290', fill: C.panel, stroke: C.soft, 'stroke-width': 1.5 }, dg); T('database', { x: 670, y: 325, 'text-anchor': 'middle', 'font-size': 15 }, dg); parts.push([dg, 0.24]);
      const pool = Array.from({ length: 10 }, () => S('circle', { r: 6, fill: C.gold, opacity: 0 }, g));
      const hitLbl = T('', { x: 600, y: 215, 'font-size': 14, fill: C.soft }, g);
      const route = (n) => { const u = users[n % 5], s = servers[n % 3], hit = (n * 7) % 10 < 7; return { pts: [[u.x + 20, u.y], [230, 225], [430, s.y], hit ? [600, 150] : [610, 300]], hit }; };
      return (p, t) => {
        parts.forEach(([el, at]) => el.setAttribute('opacity', ease(seg(p, at, at + 0.06))));
        const T0 = 0.2 * (p > 0 ? t / p : 0) || 0, gap = 0.45, life = 1.6;
        pool.forEach(c => c.setAttribute('opacity', 0));
        if (p < 0.22) return;
        const tt = t - T0; let used = 0, lastHit = null;
        for (let n = Math.max(0, Math.floor((tt - life) / gap)); n * gap <= tt && used < pool.length; n++) {
          const age = (tt - n * gap) / life; if (age < 0 || age > 1) continue;
          const r = route(n), segs = r.pts.length - 1, f = age * segs, i = Math.min(segs - 1, Math.floor(f)), k = f - i;
          const c = pool[used++]; c.setAttribute('opacity', 1); c.setAttribute('fill', i === segs - 1 && !r.hit ? C.fg : C.gold);
          c.setAttribute('cx', lerp(r.pts[i][0], r.pts[i + 1][0], k)); c.setAttribute('cy', lerp(r.pts[i][1], r.pts[i + 1][1], k));
          if (age > 0.66) lastHit = r.hit;
        }
        servers.forEach((s, i) => s.bar.setAttribute('width', 30 + 40 * Math.abs(Math.sin(t * 1.3 + i * 2))));
        hitLbl.textContent = lastHit === null ? '' : lastHit ? 'cache hit, ~1 ms' : 'cache miss, ask the database';
      };
    },

    twoPointers(g) {
      const arr = [1, 3, 4, 6, 8, 11, 15, 18], target = 14, x0 = 64, bw = 76, gap = 10;
      const steps = [[0, 7], [0, 6], [0, 5], [1, 5]];
      T('find two numbers that add up to ' + target, { x: 64, y: 70, fill: C.soft, 'font-size': 18 }, g);
      const cells = arr.map((v, i) => { const r = box(x0 + i * (bw + gap), 170, bw, 70, g, { rx: 14 }); T(String(v), { x: x0 + i * (bw + gap) + bw / 2, y: 214, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 600 }, g); return r; });
      const mkPtr = (lbl, col) => { const pg = S('g', {}, g); S('path', { d: 'M0 0 L -12 18 H 12 Z', fill: col }, pg); T(lbl, { x: 0, y: 44, 'text-anchor': 'middle', 'font-size': 16, fill: col, 'font-weight': 700 }, pg); return pg; };
      const L = mkPtr('L', C.gold), R = mkPtr('R', C.fg);
      const msg = T('', { x: 64, y: 360, 'font-size': 22 }, g);
      const cx = (i) => x0 + i * (bw + gap) + bw / 2;
      return (p) => {
        const times = [0.1, 0.32, 0.52, 0.7];
        let k = 0; times.forEach((tm, i) => { if (p >= tm) k = i; });
        const prev = steps[Math.max(0, k - 1)], cur = steps[k], m = ease(seg(p, times[k], times[k] + 0.06));
        const li = lerp(prev[0], cur[0], m), ri = lerp(prev[1], cur[1], m);
        L.setAttribute('transform', `translate(${lerp(cx(Math.floor(li)), cx(Math.ceil(li)), li % 1)} 252)`);
        R.setAttribute('transform', `translate(${lerp(cx(Math.floor(ri)), cx(Math.ceil(ri)), ri % 1)} 252)`);
        const [a, b] = cur, s = arr[a] + arr[b], found = s === target && p >= times[3];
        cells.forEach((c, i) => c.setAttribute('stroke', (i === a || i === b) ? (found ? C.ok : C.gold) : C.line));
        msg.setAttribute('fill', found ? C.ok : C.fg);
        msg.textContent = p < 0.1 ? 'one pointer at each end…' : found ? `found it: ${arr[a]} + ${arr[b]} = ${target} ✓` : `${arr[a]} + ${arr[b]} = ${s}  ${s > target ? '> ' + target + ', move R left' : '< ' + target + ', move L right'}`;
      };
    },

    rag(g) {
      const xs = [90, 245, 400, 555, 710], names = ['Question', 'Embed', 'Search', 'LLM', 'Answer'];
      const nodes = xs.map((x, i) => { const r = box(x - 62, 120, 124, 60, g, { rx: 16 }); T(names[i], { x, y: 156, 'text-anchor': 'middle', 'font-weight': 600 }, g); return r; });
      xs.slice(0, 4).forEach((x, i) => S('path', { d: `M${x + 66} 150 H ${xs[i + 1] - 70}`, stroke: C.dim, 'stroke-width': 2.5, 'marker-end': '' }, g));
      T('"What\'s our refund policy?"', { x: 30, y: 90, fill: C.soft, 'font-size': 16 }, g);
      const docs = Array.from({ length: 6 }, (_, i) => { const x = 300 + (i % 3) * 70, y = 240 + Math.floor(i / 3) * 80; const r = box(x, y, 58, 66, g, { rx: 8 }); [0, 1, 2].forEach(k => S('rect', { x: x + 10, y: y + 14 + k * 14, width: 38 - k * 8, height: 5, rx: 2, fill: C.dim }, g)); return r; });
      T('your documents', { x: 400, y: 425, 'text-anchor': 'middle', fill: C.soft, 'font-size': 14 }, g);
      const hits = [1, 3, 5];
      const dot = S('circle', { r: 9, fill: C.gold }, g);
      const chunks = hits.map(() => S('rect', { width: 26, height: 30, rx: 5, fill: C.gold, opacity: 0 }, g));
      const ans = T('Refunds within 30 days, source: policy.pdf', { x: 770, y: 235, 'text-anchor': 'end', 'font-size': 17, fill: C.gold, opacity: 0 }, g);
      return (p) => {
        const path = [[0.08, 0.2, 0, 1], [0.2, 0.32, 1, 2], [0.62, 0.74, 3, 4]];
        let shown = false;
        path.forEach(([a, b, i, j]) => { if (p >= a && p < b) { const f = ease(seg(p, a, b)); dot.setAttribute('cx', lerp(xs[i], xs[j], f)); dot.setAttribute('cy', 150); shown = true; } });
        dot.setAttribute('opacity', shown ? 1 : 0);
        const active = p < 0.2 ? 0 : p < 0.32 ? 1 : p < 0.5 ? 2 : p < 0.74 ? 3 : 4;
        nodes.forEach((n, i) => n.setAttribute('stroke', i === active ? C.gold : C.line));
        docs.forEach((d, i) => d.setAttribute('stroke', hits.includes(i) && p > 0.36 && p < 0.62 ? C.gold : C.line));
        chunks.forEach((c, k) => {
          const d = docs[hits[k]], f = ease(seg(p, 0.48 + k * 0.02, 0.6 + k * 0.02));
          const sx = +d.getAttribute('x') + 16, sy = +d.getAttribute('y') + 18;
          c.setAttribute('x', lerp(sx, 520 + k * 26, f)); c.setAttribute('y', lerp(sy, 190, f));
          c.setAttribute('opacity', p > 0.46 && p < 0.66 ? 0.9 : 0);
        });
        ans.setAttribute('opacity', ease(seg(p, 0.76, 0.84)));
      };
    },

    embeddings(g) {
      const clusters = [{ n: 'fantasy', x: 210, y: 170 }, { n: 'sci-fi', x: 590, y: 150 }, { n: 'romance', x: 420, y: 330 }];
      let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      const pts = [];
      clusters.forEach((c, ci) => { for (let i = 0; i < 11; i++) { const a = rnd() * 6.28, r = 18 + rnd() * 58; pts.push({ ci, tx: c.x + Math.cos(a) * r, ty: c.y + Math.sin(a) * r * 0.75, sx: 40 + rnd() * 720, sy: 60 + rnd() * 340, el: S('circle', { r: 7, fill: [C.gold, C.fg, C.soft][ci] }, g) }); } });
      const labs = clusters.map(c => T(c.n, { x: c.x, y: c.y - 82, 'text-anchor': 'middle', fill: C.soft, 'font-size': 16, opacity: 0 }, g));
      const q = { x: 255, y: 205 };
      const near = pts.filter(p => p.ci === 0).sort((a, b) => Math.hypot(a.tx - q.x, a.ty - q.y) - Math.hypot(b.tx - q.x, b.ty - q.y)).slice(0, 3);
      const links = near.map(n => S('line', { x1: q.x, y1: q.y, x2: n.tx, y2: n.ty, stroke: C.gold, 'stroke-width': 2.5, opacity: 0 }, g));
      const star = S('path', { d: 'M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4 Z', fill: C.gold, opacity: 0 }, g);
      const ql = T('"cosy fantasy story"', { 'font-size': 16, fill: C.gold, opacity: 0 }, g);
      const rec = S('g', { opacity: 0 }, g); box(520, 300, 250, 70, rec, { stroke: C.gold }); T('3 closest books', { x: 540, y: 328, fill: C.gold, 'font-size': 14, 'font-weight': 700 }, rec); T('= your recommendations', { x: 540, y: 354, 'font-size': 17 }, rec);
      return (p) => {
        const m = ease(seg(p, 0.04, 0.38));
        pts.forEach(pt => { pt.el.setAttribute('cx', lerp(pt.sx, pt.tx, m)); pt.el.setAttribute('cy', lerp(pt.sy, pt.ty, m)); });
        labs.forEach(l => l.setAttribute('opacity', seg(p, 0.36, 0.44)));
        const f = ease(seg(p, 0.5, 0.6)), sx = lerp(760, q.x, f), sy = lerp(60, q.y, f);
        star.setAttribute('opacity', p > 0.49 ? 1 : 0); star.setAttribute('transform', `translate(${sx} ${sy})`);
        ql.setAttribute('opacity', seg(p, 0.55, 0.6)); ql.setAttribute('x', sx + 18); ql.setAttribute('y', sy - 14);
        links.forEach((l, i) => l.setAttribute('opacity', ease(seg(p, 0.62 + i * 0.03, 0.66 + i * 0.03))));
        rec.setAttribute('opacity', ease(seg(p, 0.76, 0.82)));
      };
    },

    themeSwap(g) {
      const themes = [
        { n: 'Ocean Depths', bg: '#f1faee', pr: '#1a2332', ac: '#2d8b8b', so: '#a8dadc' },
        { n: 'Sunset Boulevard', bg: '#fdf1e7', pr: '#264653', ac: '#e76f51', so: '#f4a261' },
        { n: 'Forest Canopy', bg: '#faf9f6', pr: '#2d4a2b', ac: '#7d8471', so: '#a4ac86' },
        { n: 'Midnight Galaxy', bg: '#e6e6fa', pr: '#2b1e3e', ac: '#4a4e8f', so: '#a490c2' },
      ];
      const card = S('rect', { x: 180, y: 60, width: 440, height: 270, rx: 22 }, g);
      const head = S('rect', { x: 180, y: 60, width: 440, height: 56, rx: 22 }, g);
      const headFix = S('rect', { x: 180, y: 94, width: 440, height: 22 }, g);
      const title = T('Q3 Report', { x: 206, y: 96, 'font-size': 22, 'font-weight': 700 }, g);
      const bars = [90, 140, 110, 175, 150].map((h, i) => S('rect', { x: 210 + i * 46, y: 310 - h, width: 32, height: h, rx: 6 }, g));
      const btn1 = S('rect', { x: 470, y: 150, width: 124, height: 44, rx: 22 }, g), b1t = T('Share', { x: 532, y: 178, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600 }, g);
      const btn2 = S('rect', { x: 470, y: 206, width: 124, height: 44, rx: 22, 'stroke-width': 2, fill: 'none' }, g), b2t = T('Export', { x: 532, y: 234, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600 }, g);
      const name = T('', { x: 400, y: 380, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: C.fg }, g);
      const sw = [0, 1, 2, 3].map(i => S('circle', { cx: 340 + i * 40, cy: 412, r: 13, stroke: '#ffffff33' }, g));
      return (p) => {
        const f = clamp(p * 0.999) * themes.length, i = Math.floor(f), k = ease(seg(f - i, 0.75, 1));
        const a = themes[i], b = themes[(i + 1) % themes.length], mix = (key) => hexMix(a[key], b[key], i === themes.length - 1 ? 0 : k);
        card.setAttribute('fill', mix('bg')); head.setAttribute('fill', mix('pr')); headFix.setAttribute('fill', mix('pr'));
        title.setAttribute('fill', mix('bg'));
        bars.forEach((r, j) => r.setAttribute('fill', j === 3 ? mix('ac') : mix('so')));
        btn1.setAttribute('fill', mix('ac')); b1t.setAttribute('fill', mix('bg'));
        btn2.setAttribute('stroke', mix('pr')); b2t.setAttribute('fill', mix('pr'));
        name.textContent = (k > 0.5 && i < themes.length - 1 ? b : a).n;
        ['pr', 'ac', 'so', 'bg'].forEach((key, j) => sw[j].setAttribute('fill', mix(key)));
      };
    },
  };

  /* ---------------- player ---------------- */
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const players = [];

  // Group spoken words into short caption lines. Word timings come without punctuation,
  // so each word is matched back to the script to restore it and to break lines at sentence ends.
  function chunk(words, script) {
    const out = []; let cur = [], pos = 0;
    words.forEach((w, i) => {
      let word = w[2];
      const at = script.indexOf(word, pos);
      let breakAfter = false;
      if (at >= 0) {
        let end = at + word.length;
        while (end < script.length && /[.,?!:;'"’]/.test(script[end])) end++;
        word = script.slice(at, end);
        breakAfter = /[.?!]/.test(script.slice(at + w[2].length, end));
        const soft = /[,:;]/.test(script.slice(at + w[2].length, end));
        pos = end;
        if (soft && cur.length >= 3) breakAfter = true;
      }
      cur.push([w[0], word]);
      if (breakAfter || cur.length >= 7 || i === words.length - 1) { out.push({ t: cur[0][0], text: cur.map(x => x[1]).join(' ') }); cur = []; }
    });
    return out;
  }

  function mount(fig) {
    const id = fig.dataset.clip, data = (window.CLIP_DATA || {})[id];
    if (!data || !SCENES[data.scene]) { fig.innerHTML = `<div class="clip-missing">${data ? data.title : 'Clip unavailable'}</div>`; return; }
    fig.innerHTML = `
      <div class="clip-stage"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${data.title}"></svg></div>
      <div class="clip-cap" aria-hidden="true"><span></span></div>
      <div class="clip-bar"><i></i></div>
      <div class="clip-ui">
        <button class="clip-btn clip-play" type="button" aria-label="Pause">${ICON.pause}</button>
        <span class="clip-title">${data.title}</span>
        <button class="clip-btn clip-sound" type="button">${ICON.sound}<span>Tap for sound</span></button>
      </div>
      <p class="sr-only">${data.text}</p>`;
    const svg = fig.querySelector('svg');
    S('rect', { width: W, height: H, fill: '#0b0b0c' }, svg);
    const update = SCENES[data.scene](S('g', {}, svg), data);
    const audio = new Audio(); audio.preload = 'none'; audio.src = `assets/audio/${id}.mp3`;
    const caps = chunk(data.words, data.text), capEl = fig.querySelector('.clip-cap span'), bar = fig.querySelector('.clip-bar i');
    const playBtn = fig.querySelector('.clip-play'), soundBtn = fig.querySelector('.clip-sound');
    const P = { fig, audio, t: reduce ? data.dur * 0.6 : 0, running: !reduce, visible: false, voiced: false, last: 0, capIdx: -1 };

    function draw() {
      const dur = data.dur, t = P.t % dur, p = t / dur;
      try { update(p, t); } catch (e) { /* keep the player alive if a frame fails */ }
      bar.style.transform = `scaleX(${p})`;
      let ci = 0; caps.forEach((c, i) => { if (t >= c.t - 0.05) ci = i; });
      if (ci !== P.capIdx) { P.capIdx = ci; capEl.textContent = caps[ci].text; capEl.classList.remove('in'); void capEl.offsetWidth; capEl.classList.add('in'); }
    }
    P.tick = (now) => {
      const dt = Math.min(0.1, (now - (P.last || now)) / 1000); P.last = now;
      if (P.voiced && !audio.paused) P.t = audio.currentTime;
      else if (P.running && P.visible) P.t += dt;
      draw();
    };
    function setVoice(on) {
      if (on) {
        players.forEach(o => o !== P && o.voiced && o.stopVoice());
        P.voiced = true; P.running = true; P.t = 0; audio.currentTime = 0;
        audio.play().catch(() => { P.voiced = false; });
        soundBtn.innerHTML = ICON.mute + '<span>Sound on</span>'; soundBtn.classList.add('on');
      } else P.stopVoice();
      playBtn.innerHTML = ICON.pause; playBtn.setAttribute('aria-label', 'Pause');
    }
    P.stopVoice = () => { P.voiced = false; audio.pause(); soundBtn.innerHTML = ICON.sound + '<span>Tap for sound</span>'; soundBtn.classList.remove('on'); };
    audio.addEventListener('ended', () => { P.stopVoice(); P.t = 0; });
    soundBtn.addEventListener('click', () => setVoice(!P.voiced));
    playBtn.addEventListener('click', () => {
      P.running = !P.running;
      if (P.voiced) { if (P.running) audio.play(); else audio.pause(); }
      playBtn.innerHTML = P.running ? ICON.pause : ICON.play; playBtn.setAttribute('aria-label', P.running ? 'Pause' : 'Play');
    });
    if (!P.running) { playBtn.innerHTML = ICON.play; playBtn.setAttribute('aria-label', 'Play'); }
    players.push(P); draw();
  }

  function loop(now) { players.forEach(P => (P.visible || P.voiced) && P.tick(now)); requestAnimationFrame(loop); }

  window.WheatClips = {
    mountAll(root = document) {
      root.querySelectorAll('figure.clip[data-clip]').forEach(mount);
      const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
        const P = players.find(x => x.fig === e.target); if (!P) return;
        P.visible = e.isIntersecting; P.last = 0;
        if (!e.isIntersecting && P.voiced) P.stopVoice();
      }), { threshold: 0.35 }) : null;
      players.forEach(P => io ? io.observe(P.fig) : (P.visible = true));
      requestAnimationFrame(loop);
    },
    // for automated checks: draw a clip at a given time
    _frame(id, t) { const P = players.find(x => x.fig.dataset.clip === id); if (P) { P.t = t; P.tick(performance.now()); } },
  };
})();
