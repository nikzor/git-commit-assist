export interface ScreenManager {
  showHome(): void;
  showDiff(): void;
  showOverview(): void;
}

export function createScreenManager(
  homeScreenEl: HTMLElement,
  diffScreenEl: HTMLElement,
  overviewScreenEl: HTMLElement
): ScreenManager {
  return {
    showHome(): void {
      homeScreenEl.classList.remove('hidden');
      diffScreenEl.classList.add('hidden');
      overviewScreenEl.classList.add('hidden');
    },
    showDiff(): void {
      homeScreenEl.classList.add('hidden');
      diffScreenEl.classList.remove('hidden');
      overviewScreenEl.classList.add('hidden');
    },
    showOverview(): void {
      homeScreenEl.classList.add('hidden');
      diffScreenEl.classList.add('hidden');
      overviewScreenEl.classList.remove('hidden');
    },
  };
}
