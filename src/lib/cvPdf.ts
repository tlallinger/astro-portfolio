import type { CV } from '@/cv/types';
import type { jsPDF } from 'jspdf';
import {
  accentOnWhite,
  getTheme,
  type Palette,
  type RGB,
} from '@/styles/theme';

export interface PdfLabels {
  present: string;
  about: string;
  experience: string;
  industry: string;
  highlights: string;
  responsibilities: string;
  achievements: string;
  skills: string;
  languages: string;
  contact: string;
  generated: string;
  page: string;
}

export interface PdfPayload {
  cv: CV;
  labels: PdfLabels;
  lang: string;
  siteUrl: string;
  /** URL (or data URL) of the portrait; shown as a square at the top of the sidebar. */
  photoUrl?: string;
}

type FontStyle = 'normal' | 'bold' | 'italic';

/** Highest proficiency first; unknown labels keep their original order after these. */
const LEVEL_ORDER = [
  'Expert',
  'Experte',
  'Advanced',
  'Fortgeschritten',
  'Intermediate',
  'Mittel',
  'Beginner',
  'Anfänger',
  'Grundkenntnisse',
];

/** Neutral print colors for the white main column; everything else comes from the theme. */
const PRINT = {
  text: [39, 39, 42] as RGB,
  muted: [113, 113, 122] as RGB,
  rule: [228, 228, 231] as RGB,
};

/**
 * Maps the shared website theme onto the PDF: the sidebar mirrors the site,
 * the white main column uses neutral text and the accent darkened for print.
 */
function pdfColors(theme: Palette) {
  return {
    sidebar: theme.fill,
    sidebarText: theme.textBase,
    sidebarMuted: theme.textMuted,
    sidebarRule: theme.muted,
    sidebarAccent: theme.accent,
    sidebarChip: theme.buttonMuted,
    text: PRINT.text,
    muted: PRINT.muted,
    rule: PRINT.rule,
    accent: accentOnWhite(theme),
  };
}

// All measurements in mm (A4).
const PAGE = { width: 210, height: 297 };
const SIDEBAR = { width: 66, pad: 10 };
const MAIN = { x: SIDEBAR.width + 12, top: 18, bottom: 18 };
const MAIN_RIGHT = PAGE.width - 14;
const MAIN_WIDTH = MAIN_RIGHT - MAIN.x;
const TIMELINE = { lineX: MAIN.x + 1.6, textX: MAIN.x + 8 };
const TIMELINE_WIDTH = MAIN_RIGHT - TIMELINE.textX;

const PHOTO_WIDTH_PX = 700;
/** Horizontal inset of the portrait inside the sidebar; smaller than the text padding so the photo stands out. */
const PHOTO_INSET = 5;

const pt2mm = (pt: number) => pt * 0.3528;
const lineHeight = (size: number) => pt2mm(size) * 1.38;

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function prettyUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function formatDate(date: string | null, lang: string, present: string) {
  if (!date) return present;
  return new Date(date)
    .toLocaleString(lang, { month: 'short', year: 'numeric' })
    .replace('.', '');
}

function tint(color: RGB, amount: number): RGB {
  return color.map((c) =>
    Math.round(255 - (255 - c) * amount)
  ) as unknown as RGB;
}

function levelRank(level: string) {
  const index = LEVEL_ORDER.findIndex(
    (l) => l.toLowerCase() === level.toLowerCase()
  );
  return index === -1 ? LEVEL_ORDER.length : index;
}

/**
 * Loads the portrait and, when a canvas is available (browser), downscales it
 * and re-encodes it as a small JPEG so the PDF stays light and any source
 * format (e.g. WebP) works. The portrait has a transparent background, so the
 * canvas is painted in the sidebar color first to make it blend in seamlessly.
 * Falls back to the raw image when it is PNG/JPEG.
 */
async function loadPhoto(
  url: string,
  background: RGB
): Promise<{ data: string; format: 'JPEG' | 'PNG' } | null> {
  try {
    if (url.startsWith('data:') && typeof document === 'undefined') {
      return {
        data: url,
        format: url.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG',
      };
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();

    if (
      typeof document !== 'undefined' &&
      typeof createImageBitmap === 'function'
    ) {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = PHOTO_WIDTH_PX;
      canvas.height = Math.round(
        (PHOTO_WIDTH_PX * bitmap.height) / bitmap.width
      );
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = `rgb(${background.join(',')})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return { data: canvas.toDataURL('image/jpeg', 0.86), format: 'JPEG' };
      }
    }

    const data = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    // Without a canvas we can only hand jsPDF formats it understands natively.
    if (data?.startsWith('data:image/jpeg')) return { data, format: 'JPEG' };
    if (data?.startsWith('data:image/png')) return { data, format: 'PNG' };
    return null;
  } catch {
    return null;
  }
}

/** Builds the document without triggering a download, so it can also run headless (tests, Node). */
export async function buildCvPdf({
  cv,
  labels,
  lang,
  siteUrl,
  photoUrl,
}: PdfPayload) {
  const { jsPDF } = await import('jspdf');
  const doc: jsPDF = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const C = pdfColors(getTheme(cv.basics.theme));
  const accent = C.accent;
  const accentSoft = tint(accent, 0.12);
  const accentLine = tint(accent, 0.35);
  const { basics, work, skills, languages } = cv;
  const fullName = `${basics.firstname} ${basics.name}`;

  let y = MAIN.top;

  // ---------------------------------------------------------------- helpers
  let currentFont: { size: number; style: FontStyle; color: RGB } = {
    size: 10,
    style: 'normal',
    color: C.text,
  };
  const setFont = (
    size: number,
    style: FontStyle = 'normal',
    color: RGB = C.text
  ) => {
    currentFont = { size, style, color };
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const drawPageChrome = (pageNumber: number) => {
    doc.setFillColor(...C.sidebar);
    doc.rect(0, 0, SIDEBAR.width, PAGE.height, 'F');
    doc.setFillColor(...accent);
    doc.rect(SIDEBAR.width, 0, 1.2, PAGE.height, 'F');

    if (pageNumber > 1) {
      setFont(11, 'bold', C.sidebarText);
      doc.text(fullName, SIDEBAR.pad, MAIN.top + 2);
      setFont(8.5, 'normal', C.sidebarAccent);
      doc.text(basics.label, SIDEBAR.pad, MAIN.top + 7);
    }
  };

  const newPage = () => {
    const { size, style, color } = currentFont;
    doc.addPage();
    drawPageChrome(doc.getNumberOfPages());
    setFont(size, style, color);
    y = MAIN.top;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE.height - MAIN.bottom) newPage();
  };

  const writeLines = (lines: string[], x: number, size: number) => {
    const lh = lineHeight(size);
    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, x, y);
      y += lh;
    }
  };

  const paragraph = (
    text: string,
    size: number,
    opts: {
      style?: FontStyle;
      color?: RGB;
      x?: number;
      width?: number;
      gap?: number;
    } = {}
  ) => {
    const {
      style = 'normal',
      color = C.text,
      x = MAIN.x,
      width = MAIN_WIDTH,
      gap = 0,
    } = opts;
    setFont(size, style, color);
    writeLines(doc.splitTextToSize(text, width) as string[], x, size);
    y += gap;
  };

  const sectionTitle = (title: string) => {
    ensureSpace(18);
    y += 3;
    doc.setFillColor(...accent);
    doc.rect(MAIN.x, y - 3.2, 2.2, 4.2, 'F');
    setFont(12.5, 'bold', C.text);
    doc.text(title.toUpperCase(), MAIN.x + 5, y, { charSpace: 0.5 });
    y += 7;
  };

  interface ChipStyle {
    fill: RGB;
    stroke: RGB;
    text: RGB;
  }

  /** Lays out rounded "chips" left to right, wrapping as needed. Returns the y below the last row. */
  const chips = (
    items: string[],
    x: number,
    startY: number,
    maxWidth: number,
    style: ChipStyle,
    onNewPage?: () => number
  ) => {
    const size = 7.8;
    const padX = 2.2;
    const height = 5.4;
    const gap = 1.6;
    let cx = x;
    let cy = startY;
    setFont(size, 'normal', style.text);
    for (const item of items) {
      const width = doc.getTextWidth(item) + padX * 2;
      if (cx + width > x + maxWidth && cx > x) {
        cx = x;
        cy += height + gap;
      }
      if (onNewPage && cy + height > PAGE.height - MAIN.bottom) {
        cy = onNewPage();
        cx = x;
      }
      doc.setFillColor(...style.fill);
      doc.setDrawColor(...style.stroke);
      doc.setLineWidth(0.25);
      doc.roundedRect(cx, cy, width, height, 1.4, 1.4, 'FD');
      doc.setTextColor(...style.text);
      doc.text(item, cx + padX, cy + height / 2 + pt2mm(size) * 0.36);
      cx += width + gap;
    }
    return cy + height;
  };

  // ---------------------------------------------------------------- sidebar
  drawPageChrome(1);
  const photo = photoUrl ? await loadPhoto(photoUrl, C.sidebar) : null;
  const sideInner = SIDEBAR.width - SIDEBAR.pad * 2;
  let sy = MAIN.top;

  if (photo) {
    const { width, height } = doc.getImageProperties(photo.data);
    const photoWidth = SIDEBAR.width - PHOTO_INSET * 2;
    const photoHeight = (photoWidth * height) / width;
    doc.addImage(
      photo.data,
      photo.format,
      PHOTO_INSET,
      sy,
      photoWidth,
      photoHeight
    );
    sy += photoHeight + 10;
  }

  const sideHeading = (title: string) => {
    setFont(8, 'bold', C.sidebarAccent);
    doc.text(title.toUpperCase(), SIDEBAR.pad, sy, { charSpace: 0.6 });
    sy += 2;
    doc.setDrawColor(...C.sidebarRule);
    doc.setLineWidth(0.25);
    doc.line(SIDEBAR.pad, sy, SIDEBAR.width - SIDEBAR.pad, sy);
    sy += 5.5;
  };

  const sideEntry = (label: string, value: string, url?: string) => {
    setFont(7, 'normal', C.sidebarMuted);
    doc.text(label.toUpperCase(), SIDEBAR.pad, sy, { charSpace: 0.3 });
    sy += lineHeight(7);
    setFont(8.6, 'normal', C.sidebarText);
    const lines = (
      doc.splitTextToSize(value.replace(/\//g, '/ '), sideInner) as string[]
    ).map((line) => line.replace(/\/ /g, '/').trim());
    const top = sy;
    for (const line of lines) {
      doc.text(line, SIDEBAR.pad, sy);
      sy += lineHeight(8.6);
    }
    if (url) doc.link(SIDEBAR.pad, top - 3.2, sideInner, sy - top, { url });
    sy += 2.2;
  };

  sideHeading(labels.contact);
  if (basics.location) sideEntry('Location', basics.location);
  if (basics.email) sideEntry('Email', basics.email, `mailto:${basics.email}`);
  if (basics.phone) sideEntry('Phone', basics.phone, `tel:${basics.phone}`);
  for (const profile of basics.profiles)
    sideEntry(profile.network, prettyUrl(profile.url), profile.url);

  if (languages?.length) {
    sy += 4;
    sideHeading(labels.languages);
    for (const { language, fluency } of languages) {
      setFont(8.6, 'bold', C.sidebarText);
      doc.text(language, SIDEBAR.pad, sy);
      setFont(8, 'normal', C.sidebarMuted);
      doc.text(fluency, SIDEBAR.width - SIDEBAR.pad, sy, { align: 'right' });
      sy += lineHeight(8.6) + 1;
    }
  }

  // if (skills?.length) {
  //   sy += 4;
  //   sideHeading(labels.skills);
  //   const byLevel = new Map<string, string[]>();
  //   for (const skill of skills) byLevel.set(skill.level, [...(byLevel.get(skill.level) ?? []), skill.name]);
  //   const ordered = [...byLevel.entries()].sort(([a], [b]) => levelRank(a) - levelRank(b));
  //   const sidebarChip: ChipStyle = { fill: C.sidebarChip, stroke: C.sidebarRule, text: C.sidebarText };
  //   for (const [level, names] of ordered) {
  //     if (sy > PAGE.height - MAIN.bottom - 14) break; // sidebar is page one only
  //     setFont(7, 'normal', C.sidebarMuted);
  //     doc.text(level.toUpperCase(), SIDEBAR.pad, sy, { charSpace: 0.3 });
  //     sy += lineHeight(7) + 0.5;
  //     sy = chips(names, SIDEBAR.pad, sy, sideInner, sidebarChip) + 4;
  //   }
  // }

  setFont(7, 'normal', C.sidebarMuted);
  doc.text(siteUrl, SIDEBAR.pad, PAGE.height - 10);

  // ---------------------------------------------------------------- header
  setFont(26, 'bold', C.text);
  const nameLines = doc.splitTextToSize(fullName, MAIN_WIDTH) as string[];
  y += 6;
  for (const line of nameLines) {
    doc.text(line, MAIN.x, y);
    y += lineHeight(26) * 0.85;
  }
  y += 1;
  setFont(12, 'normal', accent);
  doc.text(basics.label, MAIN.x, y);
  y += 6;
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.line(MAIN.x, y, MAIN_RIGHT, y);
  y += 4;

  // ---------------------------------------------------------------- summary
  sectionTitle(labels.about);
  for (const block of stripHtml(basics.summary)
    .split('\n')
    .filter((s) => s.trim())) {
    paragraph(block.trim(), 9.8, { gap: 2.2, color: [63, 63, 70] });
  }

  // ---------------------------------------------------------------- experience
  sectionTitle(labels.experience);
  const techChip: ChipStyle = {
    fill: accentSoft,
    stroke: accentLine,
    text: accent,
  };
  let timelineStart = y;
  const timelineSegments: Array<{ page: number; from: number; to: number }> =
    [];
  const timelineNodes: Array<{ page: number; y: number }> = [];
  const timelineNewPage = () => {
    timelineSegments.push({
      page: doc.getNumberOfPages(),
      from: timelineStart,
      to: y,
    });
    newPage();
    timelineStart = y;
    return y;
  };
  // Re-route page breaks inside the experience block so the timeline line is drawn per page.
  const ensureSpaceTimeline = (needed: number) => {
    if (y + needed > PAGE.height - MAIN.bottom) timelineNewPage();
  };
  const writeLinesTimeline = (lines: string[], x: number, size: number) => {
    const lh = lineHeight(size);
    for (const line of lines) {
      ensureSpaceTimeline(lh);
      doc.text(line, x, y);
      y += lh;
    }
  };
  const bulletsTimeline = (items: string[], size = 9.3) => {
    const indent = 4;
    const lh = lineHeight(size);
    for (const item of items) {
      setFont(size, 'normal', C.text);
      const lines = doc.splitTextToSize(
        item,
        TIMELINE_WIDTH - indent
      ) as string[];
      ensureSpaceTimeline(lh);
      doc.setFillColor(...accent);
      doc.circle(TIMELINE.textX + 1, y - 1.15, 0.65, 'F');
      writeLinesTimeline(lines, TIMELINE.textX + indent, size);
      y += 0.9;
    }
  };

  work.forEach((job, index) => {
    ensureSpaceTimeline(26);
    const dateRange = `${formatDate(job.startDate, lang, labels.present)} – ${formatDate(job.endDate, lang, labels.present)}`;

    timelineNodes.push({ page: doc.getNumberOfPages(), y: y - 1.3 });

    setFont(8.5, 'bold', accent);
    doc.text(dateRange.toUpperCase(), TIMELINE.textX, y, { charSpace: 0.3 });
    y += lineHeight(8.5) + 0.5;

    setFont(11.5, 'bold', C.text);
    const titleLines = doc.splitTextToSize(
      job.position,
      TIMELINE_WIDTH
    ) as string[];
    writeLinesTimeline(titleLines, TIMELINE.textX, 11.5);

    setFont(10, 'bold', accent);
    const company = job.name;
    doc.text(company, TIMELINE.textX, y);
    if (job.url)
      doc.link(TIMELINE.textX, y - 3.6, doc.getTextWidth(company), 4.6, {
        url: job.url,
      });
    const companyWidth = doc.getTextWidth(company);
    const meta = [
      [job.location, job.location_type].filter(Boolean).join(' · '),
      job.industry,
    ]
      .filter(Boolean)
      .join('   ·   ');
    if (meta) {
      setFont(8.6, 'normal', C.muted);
      const metaLines = doc.splitTextToSize(
        meta,
        TIMELINE_WIDTH - companyWidth - 4
      ) as string[];
      if (metaLines.length === 1) {
        doc.text(metaLines[0], TIMELINE.textX + companyWidth + 3, y);
        y += lineHeight(10);
      } else {
        y += lineHeight(10);
        writeLinesTimeline(
          doc.splitTextToSize(meta, TIMELINE_WIDTH) as string[],
          TIMELINE.textX,
          8.6
        );
      }
    } else {
      y += lineHeight(10);
    }
    y += 2;

    const blocks: Array<[string, string[]]> = [
      [labels.highlights, (job.highlights ?? []).map(String)],
      [labels.responsibilities, job.responsibilities ?? []],
      [labels.achievements, job.achievements ?? []],
    ];
    for (const [label, items] of blocks) {
      if (!items.length) continue;
      ensureSpaceTimeline(14);
      setFont(7.5, 'bold', C.muted);
      doc.text(label.toUpperCase(), TIMELINE.textX, y, { charSpace: 0.4 });
      y += lineHeight(7.5) + 0.6;
      bulletsTimeline(items);
      y += 1.2;
    }

    const tech = Object.keys(job.skills ?? {});
    if (tech.length) {
      ensureSpaceTimeline(12);
      y =
        chips(
          tech,
          TIMELINE.textX,
          y - 1,
          TIMELINE_WIDTH,
          techChip,
          timelineNewPage
        ) + 2;
    }

    if (index < work.length - 1) y += 7;
  });
  timelineSegments.push({
    page: doc.getNumberOfPages(),
    from: timelineStart,
    to: y - 4,
  });
  const lastPage = doc.getNumberOfPages();
  for (const { page, from, to } of timelineSegments) {
    doc.setPage(page);
    doc.setDrawColor(...C.rule);
    doc.setLineWidth(0.5);
    doc.line(TIMELINE.lineX, from, TIMELINE.lineX, to);
  }
  for (const { page, y: nodeY } of timelineNodes) {
    doc.setPage(page);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.7);
    doc.circle(TIMELINE.lineX, nodeY, 1.6, 'FD');
  }
  doc.setPage(lastPage);

  // ---------------------------------------------------------------- footer
  const pageCount = doc.getNumberOfPages();
  const generatedOn = new Date().toLocaleDateString(lang, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setFont(7.5, 'normal', C.muted);
    doc.text(`${labels.generated} ${generatedOn}`, MAIN.x, PAGE.height - 10);
    doc.text(`${labels.page} ${i}/${pageCount}`, MAIN_RIGHT, PAGE.height - 10, {
      align: 'right',
    });
  }

  doc.setProperties({
    title: `${fullName} – CV`,
    subject: basics.label,
    author: fullName,
    creator: siteUrl,
  });

  return { doc, filename: `${basics.firstname}_${basics.name}_CV_${lang}.pdf` };
}

export async function generateCvPdf(payload: PdfPayload) {
  const { doc, filename } = await buildCvPdf(payload);
  doc.save(filename);
}
