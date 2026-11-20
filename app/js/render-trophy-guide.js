// The open guide: official text, meta, earned + counter, missable box, own-words guide, cited steps, sources-differ box.

import { escapeHtml, gradeBadge, citeMarks, riskTags, progressBar } from './html-helpers.js';
import { KIND_LABELS } from './trophy-data.js';
import { applySpoilerMode } from './spoiler-mode.js';

const MISSABLE_HEADINGS = {
  possibly: 'Missable? Possibly — when and why',
  watch: 'Watch — timing matters',
};

export function missableBox(trophy) {
  if (trophy.missable === 'no') return '';
  const watch = trophy.missable === 'watch' ? ' is-watch' : '';
  return `<section class="missable-box${watch}">
    <h2>${MISSABLE_HEADINGS[trophy.missable]}</h2>
    <div><b>Point of no return:</b> ${escapeHtml(trophy.pointOfNoReturn ?? 'See steps.')}</div>
  </section>`;
}

export function trophyCounter(trophy, store) {
  if (!trophy.count) return '';
  const value = store.counter(trophy.id);
  const { target, unit } = trophy.count;
  return `<div class="trophy-counter" data-counter="${trophy.id}">
    <button type="button" data-step="-1" aria-label="Decrease">−</button>
    <output>${value}/${target}</output>
    <button type="button" data-step="1" aria-label="Increase">+</button>
    ${progressBar(value, target)}<span class="muted">${escapeHtml(unit)}</span>
  </div>`;
}

export function differBox(differ) {
  if (!differ) return '';
  return `<section class="differ-box">
    <h2>SOURCES DIFFER — both versions shown</h2>
    <dl>
      <dt>Version A</dt><dd>${escapeHtml(differ.a.text)} ${citeMarks(differ.a.cites)}</dd>
      <dt>Version B</dt><dd>${escapeHtml(differ.b.text)} ${citeMarks(differ.b.cites)}</dd>
      <dt>Our call</dt><dd class="our-call">${escapeHtml(differ.call)}</dd>
    </dl>
  </section>`;
}

export function renderTrophyGuide(container, trophy, index, store) {
  if (!trophy) {
    container.innerHTML = '<p class="muted">Pick a trophy from the checklist.</p>';
    return;
  }
  const shown = applySpoilerMode(trophy, store);
  const stage = index.stages.find((s) => s.stage === trophy.roadmapStage);
  const earned = store.isEarned(trophy.id);
  const head = `<div class="guide-title">${gradeBadge(trophy.grade)}<h1>${escapeHtml(shown.name)}</h1>${riskTags(trophy, { withDiffer: true })}${trophy.hidden ? '<span class="tag tag-hidden">Hidden on PSN</span>' : ''}</div>
    <p class="guide-official"><span class="tag tag-official">Official</span> <q>${escapeHtml(shown.description)}</q></p>
    <div class="guide-meta"><span>Kind <b>${KIND_LABELS[trophy.kind]}</b></span><span>When <b>${escapeHtml(trophy.chapter)}</b></span>
      <span>Roadmap <b>stage ${trophy.roadmapStage} · ${escapeHtml(stage?.title ?? '')}</b></span></div>
    <div class="guide-actions"><label class="earned-toggle"><input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''}> Earned</label>${trophyCounter(trophy, store)}</div>`;

  if (shown.masked) {
    container.innerHTML = head + '<p class="muted">The guide for this story trophy is hidden while spoilers are off. Earn it, or switch “Spoilers hidden” off in the header to read it.</p>';
  } else {
    const steps = trophy.steps.map((s) => `<li>${escapeHtml(s.text)} ${citeMarks(s.cites)}</li>`).join('');
    container.innerHTML = head + missableBox(trophy) +
      `<h2 class="guide-section-title">Guide (our words)</h2><p class="guide-body">${escapeHtml(trophy.guide)}</p>
       <h2 class="guide-section-title">Steps — each with its sources</h2><ol class="guide-steps">${steps}</ol>` +
      differBox(trophy.differ);
  }

  container.onclick = (event) => {
    const box = event.target.closest('[data-earn]');
    if (box) store.setEarned(trophy.id, box.checked);
    const step = event.target.closest('[data-step]');
    if (step) store.setCounter(trophy.id, store.counter(trophy.id) + Number(step.dataset.step), trophy.count.target);
  };
}
