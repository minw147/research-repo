export interface Study {
  id: string;
  title: string;
  date: string;
  persona: string;
  product?: string;
  videoUrl: string;
  transcriptFile?: string;
  reportFile: string;
}

export interface StudyWithContent extends Study {
  searchText: string;
}

export interface ReportFrontmatter {
  title: string;
  date?: string;
  studyId?: string;
  [key: string]: unknown;
}

export interface Report {
  frontmatter: ReportFrontmatter;
  content: string;
}

export interface ClipProps {
  src: string;
  label: string;
  start?: number;
  participant?: string;
  duration?: string;
}
