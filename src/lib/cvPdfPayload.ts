import { getCV, t, lang } from '@/i18n/utils';
import photo from '@/assets/photo.webp';
import type { PdfLabels, PdfPayload } from '@/lib/cvPdf';

/** Everything the browser needs to render the CV PDF for the current language. */
export function buildPdfPayload(): Omit<PdfPayload, 'siteUrl'> {
  const cv = getCV();
  const labels: PdfLabels = {
    present: t('timeline.present'),
    about: t('section.about'),
    experience: t('section.experience'),
    industry: t('experience.industry'),
    highlights: t('experience.highlights'),
    responsibilities: t('experience.responsibilities'),
    achievements: t('experience.achievements'),
    skills: t('section.skills'),
    languages: t('section.languages'),
    contact: t('pdf.contact'),
    generated: t('pdf.generated'),
    page: t('pdf.page'),
  };
  return { cv, labels, lang, photoUrl: photo.src };
}

/** JSON that is safe to embed inside a <script> tag. */
export function serializePdfPayload() {
  return JSON.stringify(buildPdfPayload()).replace(/</g, '\\u003c');
}
