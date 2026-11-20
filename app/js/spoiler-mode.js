// Spoiler mode: hidden trophies (story beats, strand finales, secret moments) keep their name and description
// masked until earned or revealed one at a time. Masking is decided here and nowhere else.

import { isEarned } from './progress-store.js';

export function isTrophyMasked(trophy, state) {
  return Boolean(state.settings.spoiler && trophy.hidden && !isEarned(state.progress, trophy) && !state.ui.revealed.has(trophy.id));
}

export function maskedTrophyName(trophy) {
  if (trophy.kind === 'story') return `Hidden story trophy · ${trophy.chapter.replace(/ \(.*\)$/, '')}`;
  if (trophy.kind === 'strand') return 'Hidden strand finale';
  return 'Hidden trophy';
}

export function displayName(trophy, state) {
  return isTrophyMasked(trophy, state) ? maskedTrophyName(trophy) : trophy.name;
}

export function displayDescription(trophy, state) {
  return isTrophyMasked(trophy, state) ? 'Name and description hidden until earned' : trophy.description;
}

export function revealTrophyOnce(trophy, state) {
  state.ui.revealed.add(trophy.id);
}

export function countMaskedTrophies(state) {
  return state.trophies.filter((t) => isTrophyMasked(t, state)).length;
}

// Syncs the header switch and the body flag with the current setting.
export function applySpoilerMode(state) {
  const input = document.getElementById('spoiler-mode-input');
  input.checked = state.settings.spoiler;
  document.body.classList.toggle('spoilers-hidden', state.settings.spoiler);
  const label = document.getElementById('spoiler-state');
  label.textContent = state.settings.spoiler ? `Spoilers hidden · ${countMaskedTrophies(state)}` : 'Spoilers shown';
}
