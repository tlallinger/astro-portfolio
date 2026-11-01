/**
 * Single source of truth for all colors.
 * The website reads them as CSS variables (see Layout.astro), the CV PDF
 * imports them directly, so both always stay in sync. The site is dark only;
 * the theme switch cycles through the palettes below.
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

export interface ThemeModes {
  dark: Palette;
  light: Palette;
}

/**
 * Every theme in both modes. The site currently renders the `dark` palettes only
 * (see `activeMode`); the `light` palettes are kept so light mode can be
 * switched back on without re-tuning the colors.
 */
export const palettes = {
  green: {
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
    light: {
      textBase: [40, 40, 40],
      textMuted: [110, 110, 110],
      textInverted: [255, 255, 255],
      fill: [236, 252, 203],
      muted: [189, 220, 147],
      accent: [58, 100, 7],
      buttonAccent: [58, 100, 7],
      buttonAccentHover: [120, 220, 120],
      buttonMuted: [211, 235, 173],
    },
  },
  blue: {
    dark: {
      textBase: [248, 250, 252],
      textMuted: [148, 163, 184],
      textInverted: [2, 6, 23],
      fill: [2, 6, 23],
      muted: [51, 65, 85],
      accent: [80, 150, 250],
      buttonAccent: [80, 150, 250],
      buttonAccentHover: [0, 185, 255],
      buttonMuted: [30, 41, 59],
    },
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
  },
  red: {
    dark: {
      textBase: [231, 229, 228],
      textMuted: [168, 162, 158],
      textInverted: [28, 25, 23],
      fill: [28, 25, 23],
      muted: [45, 45, 45],
      accent: [248, 113, 113],
      buttonAccent: [248, 113, 113],
      buttonAccentHover: [220, 50, 70],
      buttonMuted: [60, 52, 48],
    },
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
  },
  orange: {
    dark: {
      textBase: [255, 255, 255],
      textMuted: [150, 150, 150],
      textInverted: [18, 18, 18],
      fill: [18, 18, 18],
      muted: [36, 36, 36],
      accent: [240, 100, 30],
      buttonAccent: [240, 100, 30],
      buttonAccentHover: [231, 121, 43],
      buttonMuted: [26, 26, 26],
    },
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
  },
} satisfies Record<string, ThemeModes>;

export type ThemeName = keyof typeof palettes;
/** Order in which the theme switch cycles. */
export const themeNames = Object.keys(palettes) as ThemeName[];

/** The mode the site renders. Change to 'light' (or make it dynamic) to bring light mode back. */
export const activeMode: keyof ThemeModes = 'dark';

/** The active palette per theme; everything else in the app reads from this. */
export const themes = themeNames.reduce(
  (acc, name) => ({ ...acc, [name]: palettes[name][activeMode] }),
  {} as Record<ThemeName, Palette>,
);

export const defaultTheme: ThemeName = 'green';

export function isThemeName(name: unknown): name is ThemeName {
  return typeof name === 'string' && name in themes;
}

export function getTheme(name: string | undefined): Palette {
  return isThemeName(name) ? themes[name] : themes[defaultTheme];
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

/** Generates the CSS variable blocks: the default theme on :root, one block per theme. */
export function themeCss(): string {
  const rules = [`:root { ${declarations(themes[defaultTheme])} }`];
  for (const [name, palette] of Object.entries(themes)) {
    rules.push(`[data-theme="${name}"] { ${declarations(palette)} }`);
  }
  // Users who ask the OS for more contrast get full-strength secondary text.
  const highContrast = Object.entries(themes)
    .map(([name, palette]) => `[data-theme="${name}"] { ${cssVariables.textMuted}: ${palette.textBase.join(', ')}; }`)
    .join(' ');
  rules.push(`@media (prefers-contrast: more) { :root { ${cssVariables.textMuted}: ${themes[defaultTheme].textBase.join(', ')}; } ${highContrast} }`);
  return rules.join('\n');
}

// --- helpers for print (white background) -----------------------------------

const luminance = ([r, g, b]: RGB) => {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export function contrastRatio(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Darkens the accent (keeping its hue) until it reads on white with at least
 * WCAG AA contrast. The site's accents are tuned for dark backgrounds and would
 * otherwise be unreadable in the PDF's main column.
 */
export function accentOnWhite(palette: Palette, minContrast = 4.5): RGB {
  const white: RGB = [255, 255, 255];
  for (let factor = 1; factor > 0; factor -= 0.02) {
    const candidate = palette.accent.map((c) => Math.round(c * factor)) as unknown as RGB;
    if (contrastRatio(candidate, white) >= minContrast) return candidate;
  }
  return [0, 0, 0];
}
