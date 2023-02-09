export type GameScreen = {
  active: boolean;
  type: string,
  element: HTMLElement;
}

export type GameScreens = Record<string, GameScreen>;

export class ScreenController {
  screens: GameScreens = {};

  activeScreen?: string;

  constructor(screens: GameScreens) {
    Object.keys(screens).forEach(screenKey => {
      if (this.screens[screenKey]) {
        throw new Error('ScreenController: This screen name already exists.');
      }

      if (screens[screenKey].active && this.activeScreen) {
        throw new Error('ScreenController: Only one screen can start activated.');
      }

      if (screens[screenKey].active) {
        this.activeScreen = screenKey;
        screens[screenKey].element.style.display = screens[screenKey].type;
      } else {
        screens[screenKey].element.style.display = 'none';
      }

      this.screens[screenKey] = screens[screenKey];
    });
  }

  change(screenName: string) {
    Object.keys(this.screens).forEach(screenKey => {
      const screen = this.screens[screenKey];

      if (screenKey === screenName) {
        this.activeScreen = screenName;
        this.screens[screenKey].active = true;
        this.screens[screenKey].element.style.display = screen.type;
      } else {
        this.screens[screenKey].active = false;
        this.screens[screenKey].element.style.display = 'none';
      }
    });
  };
};