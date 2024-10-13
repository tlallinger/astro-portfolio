export interface CV {
  basics: Basics;
  work: Array<Work>;
  skills: Array<Skills>;
  languages: Array<Languages>;
}

interface Basics {
  greet: string;
  firstname: string;
  name: string;
  theme: string;
  label: string;
  image: string;
  email: string;
  summary: string;
  profiles: Array<Profiles>;
}

interface Profiles {
  icon: string,
  network: string;
  username: string;
  url: string;
}

interface Work {
  name: string;
  position: string;
  location_type: string;
  location: string;
  responsibilities: Array<string>;
  achievements: Array<string>;
  skills: Record<string, string>;
  url: string;
  startDate: DateStr;
  endDate: DateStr | null;
  industry: string;
  highlights: Highlight;
}

type DateStr = `${string}-${string}-${string}`;

interface Skills {
  icon: string,
  name: string;
  level: string;
  keywords: Array<string>;
}

interface Languages {
  language: Language;
  fluency: string;
}

type Language =
  | "English"
  | "German"
  | string;

type Highlight = Array<String>;
