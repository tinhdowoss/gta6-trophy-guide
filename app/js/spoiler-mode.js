// Spoiler mode: the 28 trophies PlayStation hides (story beats, strands and secrets) keep their name and description
// masked until they are earned or the reader reveals one on purpose. Grade, chapter and kind stay visible so the
// roadmap still works without spoiling anything.

export function isSpoilerMasked(trophy, state) {
  return state.settings.spoiler
    && trophy.isSpoilerProtected
    && !state.progress.earned.has(trophy.id)
    && !state.ui.revealed.has(trophy.id);
}

export function maskedTrophyName(trophy) {
  if (trophy.kind === 'story') return trophy.chapter.startsWith('Main') ? 'Hidden story mission' : `Hidden story trophy · ${trophy.chapter}`;
  if (trophy.kind === 'strand') return 'Hidden strand trophy';
  return 'Hidden trophy';
}

export function displayName(trophy, state) {
  return isSpoilerMasked(trophy, state) ? maskedTrophyName(trophy) : trophy.name;
}

export function displayDescription(trophy, state) {
  return isSpoilerMasked(trophy, state)
    ? 'Name and description hidden until earned'
    : trophy.description;
}

export function revealTrophyOnce(trophy, state) {
  state.ui.revealed.add(trophy.id);
}

// Mirrors the setting onto <body> so CSS can style masked text, and onto the header switch.
export function applySpoilerMode(state) {
  document.body.classList.toggle('spoilers-hidden', state.settings.spoiler);
  const input = document.getElementById('spoiler-mode-input');
  if (input) input.checked = state.settings.spoiler;
  const label = document.querySelector('#spoiler-toggle .spoiler-label');
  if (label) {
    const masked = state.trophies.filter((t) => isSpoilerMasked(t, state)).length;
    label.textContent = state.settings.spoiler ? `Spoilers hidden · ${masked}` : 'Spoilers shown';
  }
}
