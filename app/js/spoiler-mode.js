// Spoiler setting: while it is on, the hidden story and side-strand trophies show no name or description until earned.

const SPOILER_KINDS = new Set(['story', 'strand']);

export function isSpoilerTrophy(trophy) {
  return trophy.hidden && SPOILER_KINDS.has(trophy.kind);
}

/** What a view may print for a trophy right now. */
export function applySpoilerMode(trophy, store) {
  const masked = store.get().spoilersHidden && isSpoilerTrophy(trophy) && !store.isEarned(trophy.id);
  if (!masked) return { masked: false, name: trophy.name, description: trophy.description };
  return {
    masked: true,
    name: `Hidden ${trophy.kind === 'story' ? 'story' : 'side-strand'} trophy · ${trophy.chapter}`,
    description: '▮▮▮▮▮▮ ▮▮▮▮ ▮▮▮▮▮ — earn it or show spoilers',
  };
}

export function countMaskedTrophies(trophies, store) {
  return trophies.filter((t) => applySpoilerMode(t, store).masked).length;
}

export function bindSpoilerToggle(button, store) {
  const paint = () => {
    const hidden = store.get().spoilersHidden;
    button.setAttribute('aria-pressed', String(hidden));
    button.textContent = hidden ? '🔒 Spoilers hidden' : '👁 Spoilers shown';
  };
  button.addEventListener('click', () => store.setSpoilersHidden(!store.get().spoilersHidden));
  store.subscribe(paint);
  paint();
}
