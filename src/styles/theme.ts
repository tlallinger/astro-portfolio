/**
 * Single source of truth for all colors.
 * The website reads them as CSS variables (see Layout.astro), the CV PDF
 * imports them directly, so both always stay in sync.
 */
export type RGB = readonly [number, number, number];

export interface Palette {
  textBase: RGB;
  textMuted: RGB;
  /** Text on top of a solid accent background (buttons on hover). */
  textInverted: RGB;
  fill: RGB;
  muted: RGB;
  accent: RGB;
  buttonAccent: RGB;
  buttonAccentHover: RGB;
  buttonMuted: RGB;
}

export interface Theme {
  light: Palette;
  dark: Palette;
}

export const themes = {
  orange: {
    light: {
      textBase: [0, 0, 0],
      textMuted: [120, 120, 120],
      textInverted: [255, 255, 255],
      fill: [245, 245, 245],
      muted: [200, 200, 200],
      accent: [249, 115, 22],
      buttonAccent: [249, 115, 22],
      buttonAccentHover: [55, 55, 55],
      buttonMuted: [244, 239, 238],
    },
    dark: {
      textBase: [255, 255, 255],
      textMuted: [150, 150, 150],
      textInverted: [18, 18, 18],
      fill: [18, 18, 18],
      muted: [36, 36, 36],
      accent: [227, 77, 10],
      buttonAccent: [227, 77, 10],
      buttonAccentHover: [231, 121, 43],
      buttonMuted: [26, 26, 26],
    },
  },
  blue: {
    light: {
      textBase: [15, 23, 42],
      textMuted: [100, 116, 139],
      textInverted: [240, 240, 240],
      fill: [203, 213, 225],
      muted: [148, 163, 184],
      accent: [59, 130, 246],
      buttonAccent: [59, 130, 246],
      buttonAccentHover: [0, 185, 255],
      buttonMuted: [226, 232, 240],
    },
    dark: {
      textBase: [248, 250, 252],
      textMuted: [148, 163, 184],
      textInverted: [2, 6, 23],
      fill: [2, 6, 23],
      muted: [51, 65, 85],
      accent: [59, 130, 246],
      buttonAccent: [59, 130, 246],
      buttonAccentHover: [0, 185, 255],
      buttonMuted: [30, 41, 59],
    },
  },
  red: {
    light: {
      textBase: [28, 25, 23],
      textMuted: [100, 100, 100],
      textInverted: [245, 245, 245],
      fill: [231, 229, 228],
      muted: [220, 220, 220],
      accent: [239, 68, 68],
      buttonAccent: [239, 68, 68],
      buttonAccentHover: [220, 50, 70],
      buttonMuted: [245, 245, 245],
    },
    dark: {
      textBase: [231, 229, 228],
      textMuted: [168, 162, 158],
      textInverted: [28, 25, 23],
      fill: [28, 25, 23],
      muted: [45, 45, 45],
      accent: [248, 113, 113],
      buttonAccent: [248, 113, 113],
      buttonAccentHover: [220, 50, 70],
      buttonMuted: [120, 113, 108],
    },
  },
  green: {
    light: {
      textBase: [40, 40, 40],
      textMuted: [110, 110, 110],
      textInverted: [230, 230, 230],
      fill: [236, 252, 203],
      muted: [189, 220, 147],
      accent: [101, 163, 13],
      buttonAccent: [101, 163, 13],
      buttonAccentHover: [120, 220, 120],
      buttonMuted: [211, 235, 173],
    },
    dark: {
      textBase: [230, 230, 230],
      textMuted: [128, 148, 128],
      textInverted: [10, 20, 10],
      fill: [10, 20, 10],
      muted: [54, 64, 54],
      accent: [0, 255, 153],
      buttonAccent: [132, 204, 22],
      buttonAccentHover: [120, 220, 120],
      buttonMuted: [34, 44, 34],
    },
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;
export const defaultTheme: ThemeName = 'orange';

export function getTheme(name: string | undefined): Theme {
  return name && name in themes ? themes[name as ThemeName] : themes[defaultTheme];
}

/** CSS custom property for each palette entry, as used by tailwind.config.mjs. */
const cssVariables: Record<keyof Palette, string> = {
  textBase: '--color-text-base',
  textMuted: '--color-text-muted',
  textInverted: '--color-text-inverted',
  fill: '--color-fill',
  muted: '--muted',
  accent: '--color',
  buttonAccent: '--color-button-accent',
  buttonAccentHover: '--color-button-accent-hover',
  buttonMuted: '--color-button-muted',
};

const declarations = (palette: Palette) =>
  (Object.keys(cssVariables) as Array<keyof Palette>)
    .map((key) => `${cssVariables[key]}: ${palette[key].join(', ')};`)
    .join(' ');

/** Generates the CSS variable blocks for every theme in light and dark mode. */
export function themeCss(): string {
  const rules = [
    `:root { ${declarations(themes[defaultTheme].light)} }`,
    `.dark { ${declarations(themes[defaultTheme].dark)} }`,
  ];
  for (const [name, theme] of Object.entries(themes)) {
    rules.push(`[data-theme="${name}"] { ${declarations(theme.light)} }`);
    rules.push(`.dark [data-theme="${name}"] { ${declarations(theme.dark)} }`);
  }
  return rules.join('\n');
}
