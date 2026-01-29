export const DEPARTMENTS = [
    'CSE',
    'AIDS',
    'AIML',
    'ECE',
    'EEE',
    'EIE',
    'CSD',
    'AUTO',
    'CIVIL',
    'MTS',
    'MECH',
    'FT',
    'CHEM'
] as const;

export const COMPANY_TYPES = [
    'Product Based',
    'Service Based',
    'Start-up',
    'MNC',
    'Core',
    'Consultancy'
];

export const JOB_ROLES = [
    'Software Developer',
    'System Engineer',
    'Data Analyst',
    'Data Scientist',
    'QA Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'DevOps Engineer',
    'UI/UX Designer',
    'Business Analyst',
    'Graduate Engineer Trainee'
];

export type Department = typeof DEPARTMENTS[number];
