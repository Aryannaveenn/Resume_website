// Active nav highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + sec.id) {
          a.style.color = 'var(--accent-light)';
        }
      });
    }
  });
}, { passive: true });

// Experience carousel
const timeline = document.querySelector('.timeline');
const prevBtn = document.querySelector('.timeline-nav.prev');
const nextBtn = document.querySelector('.timeline-nav.next');
const currentLabel = document.querySelector('.timeline-current');
const totalLabel = document.querySelector('.timeline-total');

if (timeline && prevBtn && nextBtn) {
  const items = timeline.querySelectorAll('.timeline-item');
  const total = items.length;
  if (totalLabel) totalLabel.textContent = total;

  const getIndex = () => {
    const step = timeline.scrollWidth / total;
    return Math.round(timeline.scrollLeft / step);
  };

  const update = () => {
    const idx = getIndex();
    if (currentLabel) currentLabel.textContent = idx + 1;
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= total - 1;
  };

  const scrollToIndex = idx => {
    const clamped = Math.max(0, Math.min(total - 1, idx));
    const target = items[clamped];
    if (target) {
      timeline.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    }
  };

  prevBtn.addEventListener('click', () => scrollToIndex(getIndex() - 1));
  nextBtn.addEventListener('click', () => scrollToIndex(getIndex() + 1));

  let scrollTimer;
  timeline.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(update, 80);
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
}

// ===== SKILLS WEB (D3 force layout) =====
(function () {
  const canvas = document.getElementById('skills-web');
  if (!canvas || typeof d3 === 'undefined') return;
  const ctx = canvas.getContext('2d');

  const CAT_COLOR = {
    frontend: '#5b9cf6',
    backend:  '#8b72d9',
    database: '#2db5b5',
    cloud:    '#48a87a',
    ai:       '#6366f1',
  };

  const ND = [
    { id: 'js',      label: 'JavaScript', short: 'JS',       cat: 'frontend', w: 1.35 },
    { id: 'react',   label: 'React',      short: 'React',    cat: 'frontend', w: 1.2  },
    { id: 'html',    label: 'HTML',       short: 'HTML',     cat: 'frontend', w: 1.0  },
    { id: 'css',     label: 'CSS',        short: 'CSS',      cat: 'frontend', w: 1.0  },
    { id: 'node',    label: 'Node.js',    short: 'Node.js',  cat: 'backend',  w: 1.35 },
    { id: 'express', label: 'Express.js', short: 'Express',  cat: 'backend',  w: 1.15 },
    { id: 'rest',    label: 'REST APIs',  short: 'REST',     cat: 'backend',  w: 1.0  },
    { id: 'mongo',   label: 'MongoDB',    short: 'Mongo',    cat: 'database', w: 1.2  },
    { id: 'sql',     label: 'SQL',        short: 'SQL',      cat: 'database', w: 1.0  },
    { id: 'ec2',     label: 'AWS EC2',    short: 'EC2',      cat: 'cloud',    w: 1.3  },
    { id: 'rds',     label: 'AWS RDS',    short: 'RDS',      cat: 'cloud',    w: 1.0  },
    { id: 's3',      label: 'AWS S3',     short: 'S3',       cat: 'cloud',    w: 1.0  },
    { id: 'iam',     label: 'IAM',        short: 'IAM',      cat: 'cloud',    w: 1.0  },
    { id: 'git',     label: 'Git',        short: 'Git',      cat: 'cloud',    w: 1.15 },
    { id: 'render',  label: 'Render',     short: 'Render',   cat: 'cloud',    w: 1.0  },
    { id: 'mcp',     label: 'Claude MCP', short: 'MCP',      cat: 'ai',       w: 1.15 },
    { id: 'aiauto',  label: 'AI Auto',    short: 'AI Auto',  cat: 'ai',       w: 1.1  },
    { id: 'n8n',     label: 'n8n',        short: 'n8n',      cat: 'ai',       w: 1.0  },
    { id: 'seo',     label: 'SEO',        short: 'SEO',      cat: 'ai',       w: 1.0  },
  ];

  const ED = [
    ['js','react'],    ['js','node'],    ['js','html'],   ['js','aiauto'],
    ['react','html'],  ['react','css'],
    ['node','express'],['node','ec2'],   ['node','render'],
    ['express','rest'],
    ['rest','mongo'],  ['rest','sql'],   ['rest','mcp'],
    ['mongo','ec2'],
    ['ec2','iam'],     ['ec2','rds'],    ['ec2','s3'],
    ['rds','sql'],
    ['git','render'],  ['git','ec2'],
    ['mcp','aiauto'],  ['aiauto','n8n'], ['aiauto','seo'],
  ];

  let W, H, dpr, sim, nodes, drawLinks, nodeById, hovId = null, resizeTimer;

  function build() {
    nodes = ND.map(d => ({
      ...d,
      r: Math.round(22 * d.w),
      color: CAT_COLOR[d.cat],
      nbrs: new Set(),
    }));
    nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
    // Pre-compute neighbor sets from raw edge data for hover highlighting
    ED.filter(([a, b]) => nodeById[a] && nodeById[b])
      .forEach(([a, b]) => { nodeById[a].nbrs.add(b); nodeById[b].nbrs.add(a); });
  }

  function startSim() {
    if (sim) sim.stop();

    // Scatter starting positions so D3 has room to work
    nodes.forEach(n => {
      n.x  = W / 2 + (Math.random() - 0.5) * W * 0.7;
      n.y  = H / 2 + (Math.random() - 0.5) * H * 0.7;
      n.vx = 0;
      n.vy = 0;
    });

    // Fresh link objects every restart (D3 mutates source/target to node refs)
    const linkObjs = ED
      .filter(([a, b]) => nodeById[a] && nodeById[b])
      .map(([a, b]) => ({ source: a, target: b }));

    const linkForce = d3.forceLink(linkObjs)
      .id(d => d.id)
      .distance(170)    // long edges = spread
      .strength(0.32);  // soft spring so repulsion wins

    sim = d3.forceSimulation(nodes)
      .force('link',    linkForce)
      .force('charge',  d3.forceManyBody().strength(-1100).distanceMax(600))
      .force('center',  d3.forceCenter(W / 2, H / 2).strength(0.04))
      .force('collide', d3.forceCollide(d => d.r + 30).strength(0.92))
      .alphaDecay(0.028)          // gentle cooling — settles in ~2.5 s
      .velocityDecay(0.38)
      .on('tick', () => {
        // After first tick D3 resolves string IDs → node objects
        drawLinks = linkForce.links();
        // Soft-clamp: keep nodes inside canvas with a little padding
        const pad = 62;
        nodes.forEach(n => {
          n.x = Math.max(pad + n.r, Math.min(W - pad - n.r, n.x));
          n.y = Math.max(pad + n.r, Math.min(H - pad - n.r, n.y));
        });
        draw();
      })
      .on('end', draw);
  }

  function toRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function lighten(hex, t) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r + (255-r)*t)},${Math.round(g + (255-g)*t)},${Math.round(b + (255-b)*t)})`;
  }

  function pillRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!drawLinks) return;
    const hov = hovId ? nodeById[hovId] : null;

    // Edges
    drawLinks.forEach(lk => {
      const a = lk.source, b = lk.target;
      const lit = hov && (a.id === hov.id || b.id === hov.id);
      const al  = hov ? (lit ? 0.72 : 0.06) : 0.22;
      const gr  = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gr.addColorStop(0, toRgba(a.color, al));
      gr.addColorStop(1, toRgba(b.color, al));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = gr;
      ctx.lineWidth = lit ? 2.5 : 1;
      ctx.stroke();
    });

    // Nodes
    nodes.forEach(n => {
      const isHov = hov && n.id === hov.id;
      const isCon = hov && hov.nbrs.has(n.id);
      const dim   = hov && !isHov && !isCon;
      const r     = isHov ? n.r * 1.14 : n.r;

      ctx.globalAlpha = dim ? 0.17 : 1;

      // Glow halo
      if (isHov || isCon) {
        const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.6);
        gr.addColorStop(0, toRgba(n.color, 0.2));
        gr.addColorStop(1, toRgba(n.color, 0));
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
      }

      // Circle fill
      const fill = ctx.createRadialGradient(n.x - r * 0.28, n.y - r * 0.28, 0, n.x, n.y, r);
      fill.addColorStop(0, lighten(n.color, 0.32));
      fill.addColorStop(1, n.color);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Short label inside node
      const fs = Math.max(9, Math.min(11, Math.floor(r * 0.46)));
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `600 ${fs}px 'Inter', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.short, n.x, n.y);

      ctx.globalAlpha = 1;

      // Full label badge below on hover
      if (isHov && n.label !== n.short) {
        ctx.font = '500 11px Inter, system-ui, sans-serif';
        const tw = ctx.measureText(n.label).width;
        const bw = tw + 18, bh = 22, bx = n.x - bw / 2, by = n.y + r + 7;
        pillRect(bx, by, bw, bh, 5);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x, by + bh / 2);
      }
    });
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let found = null, best = Infinity;
    nodes.forEach(n => {
      const d = Math.hypot(n.x - mx, n.y - my);
      if (d < n.r + 10 && d < best) { best = d; found = n; }
    });
    const fid = found ? found.id : null;
    if (fid !== hovId) {
      hovId = fid;
      canvas.style.cursor = fid ? 'pointer' : 'default';
      draw();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hovId) { hovId = null; draw(); }
    canvas.style.cursor = 'default';
  });

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLinks = null;
    startSim();
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  build();
  resize();
})();
