export type TemplateName =
  | 'classic'
  | 'modern'
  | 'compact'
  | 'contemporary'
  | 'double'
  | 'doubleColored'
  | 'elegant'
  | 'highPerformer'
  | 'ivyleague'
  | 'minimal'
  | 'multicolumn'
  | 'polished'
  | 'single'
  | 'stylish'
  | 'timeline';

export type Theme = {
  templateName: TemplateName;
  fontFamily: string;
  fontSize: string;
  bgColor: string;
  textColor: string;
  pageMargin: string;
  sectionSpacing: string;
  lineSpacing: string;
  pattern: string;
};

export type PersonalInfo = {
  fullName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  image?: string;
  visibility?: {
    [key in keyof PersonalInfo]?: boolean;
  };
};

export type FlexibleSection = {
  id: string;
  name: string;
  entries: {
    [key: string]: string | string[] | { [key: string]: unknown };
  }[];
  visibility?: {
    [key: string]: boolean;
  };
};

export type CvData = {
  title: string;
  data: {
    theme: Theme;
    personalInfo: PersonalInfo;
    sections: FlexibleSection[];
  };
};

export type Change = {
  type: 'add' | 'delete' | 'modify';
  field: string;
  oldValue?: any;
  newValue?: any;
  timestamp?: string;
};

export type Version = {
  id: number;
  description: string;
  createdAt: string;
  cvId: number;
  data: CvData;
  changes: Change[];
};
