export type CV = {
  basics: Basics;
  work: Work[];
  skills: Skill[];
  languages: Language[];
};

type Skill = {
  name: string;
  level: string;
  icon?: string;
  keywords?: string[];
};

type Language = {
  language: string;
  fluency: string;
};

type Basics = {
  greet: string;
  firstname: string;
  name: string;
  label: string;
  location: string;
  image: string;
  email: string;
  summary: string;
  theme: string;
  profiles: Profile[];
};

type Profile = {
  network: string;
  icon: string;
  username: string;
  url: string;
};

type Work = {
  name: string;
  position: string;
  location_type: string;
  location: string;
  url: string;
  startDate: string;
  endDate: string | null;
  industry: string;
  highlights: string[];
  responsibilities: string[];
  achievements: string[];
  skills: Record<string, string>;
};
