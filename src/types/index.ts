export type UserRole =
    | 'ADMIN'
    | 'PLACEMENT_HEAD'
    | 'TRAINING_HEAD'
    | 'DEPT_COORDINATOR'
    | 'CLASS_COORDINATOR'
    | 'STUDENT';

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    displayName: string;
    department?: string;
    classId?: string;
    profileCompleted: boolean;
    createdAt: number;
}

export interface Company {
    id: string;
    name: string;
    description: string;
    roles: string[]; // Select multiple roles? Or just one? User said dropdown.
    type: string; // Product, Service, etc.
    targetYear: number;
    salary: string;
    eligibilityCriteria: {
        minCGPA: number;
        backlogsAllowed: number;
        sslc: number; // 10th Marks
        hsc: number; // 12th Marks
        branches: string[];
    };
    deadline: number;
    driveDate: number;
    rounds: string; // Description of rounds
    applicants: string[];
}

export interface Training {
    id: string;
    title: string;
    description: string;
    trainer: string;
    startDate: number;
    endDate: number;
    eligibility: {
        branches: string[];
        year: number;
    };
    participants: string[]; // List of student UIDs
}
