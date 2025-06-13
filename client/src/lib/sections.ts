import type { FlexibleSection } from '../types/cv';

const summarySection: FlexibleSection = {
  id: 'summary',
  name: 'Summary',
  entries: [
    {
      summary: 'Passionate software engineer with a focus on frontend development. Experienced in building responsive web applications using React, TypeScript, and Tailwind CSS. Strong problem-solving skills and a commitment to continuous learning.',
    },
  ],
};

const projectsSection: FlexibleSection = {
  id: 'projects',
  name: 'Projects',
  entries: [
    {
      title: 'Portfolio Website',
      description:
        'A personal portfolio website showcasing my projects and skills.',
      url: 'https://3bdelrahmanmoussa.com',
    },
    {
      title: 'E-commerce Platform',
      description:
        'An e-commerce platform built with React and Node.js, featuring a user-friendly interface and secure payment processing.',
      url: 'https://3bdelrahmanmoussa.com',
    },
  ],
  visibility: {
    title: true,
    description: true,
    url: true,
  },
};

const educationSection: FlexibleSection = {
  id: 'education',
  name: 'Education',
  entries: [
    {
      institution: 'Cairo University',
      degree: 'Bachelor of Science in Computer Science',
      startDate: '2018-09-01',
      endDate: '2022-06-01',
      description:
        'Graduated with honors, focusing on software engineering and web development.',
    },
    {
      institution: 'Udacity',
      degree: 'Front-End Web Developer Nanodegree',
      startDate: '2022-01-01',
      endDate: '2022-12-01',
      description:
        'Completed a comprehensive program covering HTML, CSS, JavaScript, and React.',
    },
  ],
  visibility: {
    institution: true,
    degree: false,
    startDate: true,
    endDate: true,
    description: true,
  },
};

const experienceSection: FlexibleSection = {
  id: 'experience',
  name: 'Experience',
  entries: [
    {
      company: 'Tech Company',
      position: 'Frontend Developer Intern',
      startDate: '2022-06-01',
      endDate: '2022-09-01',
      description:
        'Assisted in developing user interfaces for web applications using React and Tailwind CSS.',
    },
    {
      company: 'Freelance',
      position: 'Web Developer',
      startDate: '2021-01-01',
      endDate: '2022-05-01',
      description:
        'Worked on various freelance projects, building responsive websites and web applications.',
    },
  ],
  visibility: {
    company: true,
    position: true,
    startDate: true,
    endDate: true,
    description: true,
  },
};

const languagesSection: FlexibleSection = {
  id: 'languages',
  name: 'Languages',
  entries: [
    {
      name: 'English',
      proficiency: '1',
    },
    {
      name: 'Arabic',
      proficiency: '5',
    },
    {
      name: 'French',
      proficiency: '2',
    },
  ],
};

const skillsSection: FlexibleSection = {
  id: 'skills',
  name: 'Skills',
  entries: [
    {
      title: 'Soft Skills',
      skills: [
        'Teamwork',
        'Problem-solving',
        'Time management',
        'Adaptability',
        'Critical thinking',
      ],
    },
    {
      title: 'Hard Skills',
      skills: [
        'JavaScript',
        'TypeScript',
        'React',
        'Tailwind CSS',
        'Node.js',
        'Express.js',
        'MongoDB',
        'Git',
      ],
    },
  ],
  visibility: {
    title: true,
  },
};

const findMeOnlineSection: FlexibleSection = {
  id: 'findMeOnline',
  name: 'Find Me Online',
  entries: [
    {
      platform: 'LinkedIn',
      userName: '3bdelrahmanmoussa',
      icon: 'linkedin',
    },
    {
      platform: 'GitHub',
      userName: '3bdelrahmanmoussa',
      icon: 'github',
    },
    {
      platform: 'Twitter',
      userName: '3bdelrahmanmoussa',
      icon: 'twitter',
    },
  ],
  visibility: {
    icon: true,
  },
};

export {
  summarySection,
  projectsSection,
  educationSection,
  experienceSection,
  languagesSection,
  skillsSection,
  findMeOnlineSection,
};
