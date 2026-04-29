/**
 * panel.js — Side panel UI
 *
 * Implements the three-step Interceptor flow (Brief → Interrogate → Verdict)
 * in vanilla JS, matching the noir design system.
 * On final submission calls CalendarAPI.createCalendarEvent().
 */

(function () {
  'use strict';

  // ─── Seed data (mirrors src/lib/seed.ts) ───────────────────────────────────
  const TEAM = [
    { name: 'Priya Shah',    role: 'VP Product',        rate: 180 },
    { name: 'Marcus Reed',   role: 'Engineering Lead',   rate: 140 },
    { name: 'Elena Rossi',   role: 'Senior PM',          rate: 120 },
    { name: 'Dan Owusu',     role: 'Staff Engineer',     rate: 150 },
    { name: 'Mei Lin',       role: 'Product Designer',   rate: 110 },
    { name: 'Jordan Blake',  role: 'Data Analyst',       rate: 95  },
    { name: 'Sam Patel',     role: 'Customer Success',   rate: 80  },
    { name: 'Nora Kim',      role: 'Marketing Manager',  rate: 100 },
    { name: 'Luis Alvarez',  role: 'Frontend Engineer',  rate: 120 },
    { name: 'Ada Njoku',     role: 'QA Engineer',        rate: 90  },
  ];

  const ROLE_SUGGESTIONS = [
    'VP Product', 'Engineering Lead', 'Senior PM', 'Staff Engineer',
    'Product Designer', 'Data Analyst', 'Customer Success', 'Marketing Manager',
    'Frontend Engineer', 'QA Engineer', 'CEO', 'CTO', 'Head of Design',
    'Sales Lead', 'Operations Manager',
  ];

  const GOAL_HINTS = {
    decision:  'A call must be made',
    update:    'Sharing status',
    brainstorm:'Generate ideas',
    other:     'Something else',
  };

  // ─── State ─────────────────────────────────────────────────────────────────
  const state = {
    step: 'brief',          // 'brief' | 'questions' | 'verdict'
    title: '',
    date: (() => {
      const d = new Date(); d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })(),
    time: '10:00',
    duration: 45,
    location: '',
    attendees: [],          // [{ name, role, rate }]
    emails: [],             // attendee email addresses for GCal
    goal: 'decision',
    outcome: '',
    verdict: null,          // computed recommendation
    submitting: false,
  };

  // ─── DOM refs ──────────────────────────────────────────────────────────────
  const main     = document.getElementById('panelMain');
  const stepBar  = document.getElementById('stepBar');
  const toast    = document.getElementById('toast');
  let toastTimer = null;

  // ─── Init ──────────────────────────────────────────────────────────────────
  chrome.storage.session.get('pendingContext', ({ pendingContext }) => {
    if (pendingContext?.date) state.date = pendingContext.date;
    if (pendingContext?.time) state.time = pendingContext.time;
    renderStep();
  });

  // ─── Step renderer ─────────────────────────────────────────────────────────
  function renderStep() {
    updateStepBar();
    main.innerHTML = '';
    const el = state.step === 'brief'     ? renderBrief()
             : state.step === 'questions' ? renderQuestions()
             : renderVerdict();
    el.classList.add('fade-in');
    main.appendChild(el);
  }

  function updateStepBar() {
    const steps = ['brief', 'questions', 'verdict'];
    const idx = steps.indexOf(state.step);
    stepBar.querySelectorAll('.step-item').forEach((item, i) => {
      item.classList.toggle('active', i === idx);
      item.classList.toggle('done', i < idx);
    });
  }

  // ─── Step 1: Brief ─────────────────────────────────────────────────────────
  function renderBrief() {
    const wrap = el('div');

    wrap.appendChild(banner('☠', 'Before this meeting enters the evidence log, prove it deserves to exist.'));

    // Title
    wrap.appendChild(field('Meeting title', inputEl('text', state.title, (v) => { state.title = v; updateNext(); }, 'e.g. Q3 roadmap sync')));

    // Date + time
    const dt = el('div', 'grid-2');
    dt.appendChild(field('Date', inputEl('date', state.date, (v) => { state.date = v; })));
    dt.appendChild(field('Start time', inputEl('time', state.time, (v) => { state.time = v; })));
    wrap.appendChild(dt);

    // Duration + location
    const dl = el('div', 'grid-2');
    dl.appendChild(field('Duration', durationSelect()));
    dl.appendChild(field('Location / link', inputEl('text', state.location, (v) => { state.location = v; }, 'Zoom, room, Meet…')));
    wrap.appendChild(dl);

    // Attendees
    wrap.appendChild(field(`Suspects${state.attendees.length > 0 ? ` — ${state.attendees.length} identified` : ''}`, attendeeSection(), 'attendees-field'));

    // Emails for Calendar
    wrap.appendChild(field('Attendee emails (for Google Calendar invite)', emailSection()));

    // Buttons
    const btnRow = el('div', 'btn-row');
    btnRow.appendChild(ghostBtn('Cancel', () => window.close()));
    const nextBtn = stampBtn('INTERROGATE →', () => { state.step = 'questions'; renderStep(); }, false, 'btn-primary');
    nextBtn.id = 'brief-next';
    nextBtn.disabled = !(state.title.trim() && state.attendees.length > 0);
    btnRow.appendChild(nextBtn);
    wrap.appendChild(btnRow);

    return wrap;
  }

  function updateNext() {
    const btn = document.getElementById('brief-next');
    if (btn) btn.disabled = !(state.title.trim() && state.attendees.length > 0);
  }

  function durationSelect() {
    const sel = document.createElement('select');
    [15, 30, 45, 60, 90, 120].forEach((d) => {
      const o = document.createElement('option');
      o.value = d; o.textContent = `${d} min`; o.selected = d === state.duration;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => { state.duration = Number(sel.value); });
    return sel;
  }

  function attendeeSection() {
    const wrap = el('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '10px';

    const listWrap = el('div');
    wrap.appendChild(listWrap);
    renderAttendeeList(listWrap);

    // Add form
    const addBox = el('div', 'add-suspect-box');
    const addLabel = el('div', 'add-suspect-label');
    addLabel.textContent = 'Add suspect';
    addBox.appendChild(addLabel);

    const row = el('div', 'add-suspect-row');

    const nameIn = document.createElement('input');
    nameIn.placeholder = 'Full name'; nameIn.className = '';
    applyInputStyle(nameIn);

    const roleWrap = el('div', 'rel');
    const roleIn = document.createElement('input');
    roleIn.placeholder = 'Role';
    applyInputStyle(roleIn);
    const suggBox = el('div', 'suggestions');
    suggBox.style.display = 'none';
    roleWrap.appendChild(roleIn);
    roleWrap.appendChild(suggBox);

    roleIn.addEventListener('input', () => {
      const q = roleIn.value.toLowerCase();
      suggBox.innerHTML = '';
      const matches = q ? ROLE_SUGGESTIONS.filter((r) => r.toLowerCase().includes(q) && r !== roleIn.value) : [];
      if (matches.length) {
        matches.forEach((r) => {
          const b = document.createElement('button');
          b.textContent = r;
          b.addEventListener('mousedown', (e) => { e.preventDefault(); roleIn.value = r; suggBox.style.display = 'none'; });
          suggBox.appendChild(b);
        });
        suggBox.style.display = 'block';
      } else {
        suggBox.style.display = 'none';
      }
    });
    roleIn.addEventListener('blur', () => setTimeout(() => { suggBox.style.display = 'none'; }, 150));

    const rateIn = document.createElement('input');
    rateIn.type = 'number'; rateIn.placeholder = '£/hr'; rateIn.min = '0';
    applyInputStyle(rateIn);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary btn-small btn-icon';
    addBtn.textContent = '+';
    addBtn.style.fontSize = '18px';

    const doAdd = () => {
      const name = nameIn.value.trim();
      const role = roleIn.value.trim();
      if (!name || !role) return;
      if (state.attendees.find((a) => a.name.toLowerCase() === name.toLowerCase())) return;
      state.attendees.push({ name, role, rate: Number(rateIn.value) || 100 });
      nameIn.value = ''; roleIn.value = ''; rateIn.value = '';
      renderAttendeeList(listWrap);
      updateNext();
      // refresh the parent field label
      const lbl = wrap.closest('.field')?.querySelector('.field-label');
      if (lbl) lbl.textContent = `Suspects${state.attendees.length > 0 ? ` — ${state.attendees.length} identified` : ''}`;
    };

    [nameIn, roleIn, rateIn].forEach((inp) => inp.addEventListener('keydown', (e) => e.key === 'Enter' && doAdd()));
    addBtn.addEventListener('click', doAdd);

    row.appendChild(nameIn);
    row.appendChild(roleWrap);
    row.appendChild(rateIn);
    row.appendChild(addBtn);
    addBox.appendChild(row);
    wrap.appendChild(addBox);

    // Quick-add chips
    const unaddedTeam = TEAM.filter((t) => !state.attendees.find((a) => a.name === t.name));
    if (unaddedTeam.length > 0) {
      const chipLabel = el('div');
      chipLabel.style.cssText = 'font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--outline-subtle);margin-bottom:4px;margin-top:2px;';
      chipLabel.textContent = 'Quick-add known suspects';
      const chipList = el('div', 'chip-list');
      unaddedTeam.forEach((a) => {
        const chip = el('button', 'chip');
        chip.textContent = `+ ${a.name} · ${a.role}`;
        chip.addEventListener('click', () => {
          if (!state.attendees.find((x) => x.name === a.name)) {
            state.attendees.push({ ...a });
            renderAttendeeList(listWrap);
            chip.remove();
            updateNext();
          }
        });
        chipList.appendChild(chip);
      });
      wrap.appendChild(chipLabel);
      wrap.appendChild(chipList);
    }

    return wrap;
  }

  function renderAttendeeList(container) {
    container.innerHTML = '';
    if (state.attendees.length === 0) return;
    const list = el('div', 'attendee-list');
    state.attendees.forEach((a) => {
      const row = el('div', 'attendee-row');
      const left = el('div');
      const name = el('span', 'attendee-name'); name.textContent = a.name;
      const role = el('span', 'attendee-role'); role.textContent = a.role;
      left.appendChild(name); left.appendChild(role);
      const right = el('div'); right.style.display = 'flex'; right.style.alignItems = 'center'; right.style.gap = '8px';
      const rate = el('span', 'attendee-rate'); rate.textContent = `£${a.rate}/hr`;
      const rmBtn = el('button', 'attendee-remove'); rmBtn.textContent = '×';
      rmBtn.addEventListener('click', () => {
        state.attendees = state.attendees.filter((x) => x.name !== a.name);
        renderAttendeeList(container);
        updateNext();
      });
      right.appendChild(rate); right.appendChild(rmBtn);
      row.appendChild(left); row.appendChild(right);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function emailSection() {
    const wrap = el('div');
    const chipList = el('div', 'email-chip-list');
    wrap.appendChild(chipList);

    const renderChips = () => {
      chipList.innerHTML = '';
      state.emails.forEach((email) => {
        const chip = el('span', 'email-chip');
        chip.textContent = email;
        const rm = el('button', 'email-chip-remove'); rm.textContent = '×';
        rm.addEventListener('click', () => { state.emails = state.emails.filter((e) => e !== email); renderChips(); });
        chip.appendChild(rm);
        chipList.appendChild(chip);
      });
    };

    const inp = document.createElement('input');
    inp.type = 'email'; inp.placeholder = 'name@company.com — press Enter to add';
    applyInputStyle(inp);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = inp.value.trim().replace(/,$/, '');
        if (v && !state.emails.includes(v)) { state.emails.push(v); renderChips(); }
        inp.value = '';
      }
    });
    wrap.appendChild(inp);
    renderChips();
    return wrap;
  }

  // ─── Step 2: Questions ─────────────────────────────────────────────────────
  function renderQuestions() {
    const wrap = el('div');

    const hdr = el('div');
    const h = el('div', 'section-heading'); h.textContent = 'Two questions.';
    const sub = el('div', 'section-sub'); sub.textContent = "Answer honestly. We're not here to make you feel good.";
    hdr.appendChild(h); hdr.appendChild(sub);
    wrap.appendChild(hdr);

    // Goal grid
    const goalGrid = el('div', 'goal-grid');
    Object.keys(GOAL_HINTS).forEach((g) => {
      const btn = el('button', `goal-btn${state.goal === g ? ' selected' : ''}`);
      const title = el('div', 'goal-btn-title'); title.textContent = g.toUpperCase();
      const hint = el('div', 'goal-btn-hint'); hint.textContent = GOAL_HINTS[g];
      btn.appendChild(title); btn.appendChild(hint);
      btn.addEventListener('click', () => {
        state.goal = g;
        goalGrid.querySelectorAll('.goal-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      goalGrid.appendChild(btn);
    });
    wrap.appendChild(field('What is this meeting\'s crime?', goalGrid));

    // Outcome textarea
    const ta = document.createElement('textarea');
    ta.rows = 3; ta.value = state.outcome;
    ta.placeholder = 'e.g. Decide between option A and B so engineering can ship on Monday.';
    applyInputStyle(ta);
    ta.addEventListener('input', () => { state.outcome = ta.value; });
    wrap.appendChild(field('What exact outcome is required?', ta, null, 'Vague answers will be used against you.'));

    // Buttons
    const btnRow = el('div', 'btn-row btn-row-space');
    btnRow.appendChild(ghostBtn('← Back', () => { state.step = 'brief'; renderStep(); }));
    btnRow.appendChild(stampBtn('DELIVER VERDICT →', () => {
      state.verdict = computeVerdict();
      state.step = 'verdict';
      renderStep();
    }, false, 'btn-primary'));
    wrap.appendChild(btnRow);

    return wrap;
  }

  // ─── Step 3: Verdict ───────────────────────────────────────────────────────
  function renderVerdict() {
    const rec = state.verdict;
    const wrap = el('div');

    // Verdict card
    const vc = verdictCard(rec);
    wrap.appendChild(vc);

    if (rec.verdict !== 'kill' && rec.verdict !== 'async') {
      // Suspects table
      const sec = el('div', 'section-card');
      const hdr = el('div', 'section-header');
      const lbl = el('div'); lbl.style.display = 'flex'; lbl.style.alignItems = 'center'; lbl.style.gap = '6px';
      lbl.innerHTML = `<span style="color:var(--yellow)">👥</span> Suspects`;
      const tag = el('span', 'evidence-tag'); tag.textContent = `${rec.keep.length} of ${state.attendees.length}`;
      hdr.appendChild(lbl); hdr.appendChild(tag);
      sec.appendChild(hdr);
      rec.keep.forEach((a) => sec.appendChild(suspectRow(a, true)));
      rec.drop.forEach((a) => sec.appendChild(suspectRow(a, false)));
      wrap.appendChild(sec);

      // Stats
      const stats = el('div', 'stat-grid');
      stats.appendChild(statCard('⏱', 'Duration trimmed to', `${rec.duration} min`));
      stats.appendChild(statCard('✦', 'Case owner', rec.owner));
      wrap.appendChild(stats);

      // Agenda
      if (rec.agenda.length > 0) {
        const agSec = el('div', 'section-card');
        const agHdr = el('div', 'section-header'); agHdr.textContent = 'AGENDA';
        agSec.appendChild(agHdr);
        const agList = el('ol', 'agenda-list');
        rec.agenda.forEach((line) => {
          const li = document.createElement('li'); li.textContent = line; agList.appendChild(li);
        });
        agSec.appendChild(agList);
        wrap.appendChild(agSec);
      }
    }

    // Error area
    const errArea = el('div');
    errArea.id = 'verdict-error';
    wrap.appendChild(errArea);

    // Buttons
    const btnRow = el('div', 'btn-row btn-row-space');
    btnRow.appendChild(ghostBtn('← Back', () => { state.step = 'questions'; renderStep(); }));

    const actionRow = el('div'); actionRow.style.display = 'flex'; actionRow.style.gap = '8px';

    if (rec.verdict === 'kill' || rec.verdict === 'async') {
      actionRow.appendChild(ghostBtn('Schedule anyway', () => submitEvent(false)));
      actionRow.appendChild(stampBtn('☠ KILL IT', () => submitEvent(true), true, 'btn-danger'));
    } else {
      actionRow.appendChild(ghostBtn('Ignore suggestions', () => submitEvent(false)));
      actionRow.appendChild(stampBtn('✓ APPLY & FILE', () => submitEvent(true), false, 'btn-primary'));
    }

    btnRow.appendChild(actionRow);
    wrap.appendChild(btnRow);

    return wrap;
  }

  async function submitEvent(accepted) {
    if (state.submitting) return;

    // If verdict says kill and user accepted — don't create a calendar event
    if (accepted && (state.verdict.verdict === 'kill' || state.verdict.verdict === 'async')) {
      showToast('Meeting killed. No calendar event created.', 'success');
      setTimeout(() => window.close(), 1800);
      return;
    }

    state.submitting = true;
    const submitBtns = document.querySelectorAll('#verdict-error ~ div button');
    submitBtns.forEach((b) => { b.disabled = true; });

    const errArea = document.getElementById('verdict-error');
    if (errArea) errArea.innerHTML = '';

    const description = [
      state.outcome ? `Outcome: ${state.outcome}` : '',
      state.verdict.verdict !== 'keep' ? `\n[Meet is Murder verdict: ${state.verdict.verdict.toUpperCase()}]` : '',
      state.verdict.agenda.length ? `\nAgenda:\n${state.verdict.agenda.map((l, i) => `${i + 1}. ${l}`).join('\n')}` : '',
    ].filter(Boolean).join('\n').trim();

    try {
      const event = await CalendarAPI.createCalendarEvent({
        title:       state.title,
        date:        state.date,
        time:        state.time,
        duration:    accepted ? state.verdict.duration : state.duration,
        location:    state.location,
        description,
        emails:      state.emails,
        goal:        state.goal,
        outcome:     state.outcome,
        verdict:     state.verdict.verdict,
      });

      showToast(`✓ "${event.summary}" added to Google Calendar`, 'success');
      setTimeout(() => window.close(), 2000);
    } catch (err) {
      state.submitting = false;
      submitBtns.forEach((b) => { b.disabled = false; });
      if (errArea) {
        errArea.innerHTML = '';
        const errEl = el('div', 'inline-error');
        errEl.textContent = `Error: ${err.message}`;
        errArea.appendChild(errEl);
      }
    }
  }

  // ─── Verdict computation (mirrors src/lib/recommend.ts logic) ──────────────
  function computeVerdict() {
    const { goal, outcome, attendees, duration, title } = state;
    const count = attendees.length;
    const totalCost = attendees.reduce((s, a) => s + a.rate, 0) * (duration / 60);
    const hasOutcome = outcome.trim().length > 10;

    let verdict;
    if (goal === 'update' && count > 3) {
      verdict = 'async';
    } else if (!hasOutcome && goal !== 'brainstorm') {
      verdict = 'kill';
    } else if (count > 7 || totalCost > 500) {
      verdict = 'trim';
    } else {
      verdict = 'keep';
    }

    const headlines = {
      kill:  "This meeting has no case to make. Kill it.",
      async: "An email would do the same job for free.",
      trim:  "This meeting is overweight. Cut the fat.",
      keep:  "This meeting survives — barely.",
    };

    const asyncAlt = goal === 'update'
      ? 'Send a written update with a 24h reply deadline instead.'
      : '';

    // Trim attendees: drop everyone whose role isn't essential for the goal
    const essentialRoles = {
      decision:  ['VP', 'Lead', 'Manager', 'Head', 'Director', 'CEO', 'CTO', 'CPO'],
      update:    [],
      brainstorm:['Designer', 'PM', 'Engineer', 'Analyst'],
      other:     [],
    };
    const keywords = essentialRoles[goal] || [];
    const keep = count <= 5 ? attendees
      : attendees.filter((a) => keywords.some((k) => a.role.toLowerCase().includes(k.toLowerCase())) || a.rate >= 120);
    const drop = attendees.filter((a) => !keep.includes(a));

    const trimmedDuration = verdict === 'trim'
      ? Math.max(15, Math.round((duration * 0.67) / 15) * 15)
      : duration;

    const owner = (keep[0] || attendees[0])?.name || 'TBD';

    const agendaMap = {
      decision: [
        `State the decision to be made: "${title}"`,
        'Present options (5 min each)',
        'Pros/cons debate',
        `Decide and assign owner: ${owner}`,
      ],
      update:    [`Status update: ${title}`, 'Blockers', 'Next steps'],
      brainstorm:['Problem framing (5 min)', 'Silent ideation (10 min)', 'Group clustering', 'Top ideas vote'],
      other:     [`Open discussion: ${title}`, 'Action items', 'Owner assignment'],
    };

    return { verdict, headline: headlines[verdict], asyncAlternative: asyncAlt, keep, drop, duration: trimmedDuration, owner, agenda: agendaMap[goal] || [] };
  }

  // ─── UI helpers ────────────────────────────────────────────────────────────
  function el(tag, cls = '') {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function applyInputStyle(inp) {
    // Styles are defined in styles.css via element selectors
    return inp;
  }

  function field(label, child, id = null, hint = null) {
    const wrap = el('div', 'field');
    if (id) wrap.id = id;
    const lbl = el('label', 'field-label'); lbl.textContent = label;
    wrap.appendChild(lbl);
    if (child instanceof HTMLElement) {
      wrap.appendChild(child);
    }
    if (hint) {
      const h = el('div', 'field-hint'); h.textContent = hint;
      wrap.appendChild(h);
    }
    return wrap;
  }

  function inputEl(type, value, onChange, placeholder = '') {
    const inp = document.createElement('input');
    inp.type = type; inp.value = value;
    if (placeholder) inp.placeholder = placeholder;
    inp.addEventListener('input', () => onChange(inp.value));
    return inp;
  }

  function banner(icon, text) {
    const b = el('div', 'banner');
    const ic = el('span', 'banner-icon'); ic.textContent = icon;
    const t = el('span'); t.textContent = text;
    b.appendChild(ic); b.appendChild(t);
    return b;
  }

  function stampBtn(label, onClick, danger = false, cls = 'btn-primary') {
    const btn = el('button', `btn ${cls}`);
    btn.innerHTML = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function ghostBtn(label, onClick) {
    const btn = el('button', 'btn btn-ghost');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function verdictCard(rec) {
    const colorMap = {
      kill:  { border: '#eb5757', shadow: '#eb5757', bg: '#1a0a0a', accent: '#eb5757', icon: '☠' },
      async: { border: '#f2c94c', shadow: '#f2c94c', bg: '#1a1400', accent: '#f2c94c', icon: '⚡' },
      trim:  { border: '#99907b', shadow: '#000',    bg: '#141414', accent: '#99907b', icon: '⚠' },
      keep:  { border: '#4caf7d', shadow: '#4caf7d', bg: '#0a1a0e', accent: '#4caf7d', icon: '✓' },
    };
    const s = colorMap[rec.verdict] || colorMap.keep;
    const card = el('div', 'verdict-card');
    card.style.cssText = `background:${s.bg};border-color:${s.border};box-shadow:4px 4px 0 ${s.shadow};`;

    const labelRow = el('div', 'verdict-label');
    labelRow.style.color = s.accent;
    labelRow.textContent = `${s.icon}  ${rec.verdict.toUpperCase()} — `;
    const labelText = {
      kill: 'CASE CLOSED', async: 'MAKE IT ASYNC', trim: 'TRIM AND PROCEED', keep: 'MEETING SURVIVES',
    };
    labelRow.textContent = `${s.icon}  ${labelText[rec.verdict]}`;

    const headline = el('div', 'verdict-headline');
    headline.textContent = rec.headline;

    card.appendChild(labelRow);
    card.appendChild(headline);

    if (rec.asyncAlternative) {
      const alt = el('div', 'async-alt');
      alt.innerHTML = `<strong>ASYNC INSTEAD:</strong> ${rec.asyncAlternative}`;
      card.appendChild(alt);
    }
    return card;
  }

  function suspectRow(a, keep) {
    const row = el('div', 'suspect-row');
    const left = el('div');
    left.style.opacity = keep ? '1' : '0.4';
    left.style.textDecoration = keep ? 'none' : 'line-through';
    const name = el('div', 'suspect-name'); name.textContent = a.name;
    const role = el('div', 'suspect-role'); role.textContent = a.role;
    left.appendChild(name); left.appendChild(role);

    const badge = el('span', `verdict-badge ${keep ? 'badge-keep' : 'badge-drop'}`);
    badge.textContent = keep ? '✓ KEEP' : '× DROP';

    row.appendChild(left); row.appendChild(badge);
    return row;
  }

  function statCard(icon, label, value) {
    const card = el('div', 'stat-card');
    const lbl = el('div', 'stat-label');
    lbl.innerHTML = `<span class="icon">${icon}</span> ${label}`;
    const val = el('div', 'stat-value'); val.textContent = value;
    card.appendChild(lbl); card.appendChild(val);
    return card;
  }

  function showToast(message, type = 'success') {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('visible'));
    });
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
  }
})();
