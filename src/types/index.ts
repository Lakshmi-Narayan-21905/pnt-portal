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
    photoURL?: string;
    role: UserRole;
    displayName: string;
    rollNo?: string;
    department?: string;
    classId?: string;
    section?: string;
    phone?: string;
    address?: string;
    cgpa?: number;
    tenthMark?: number;
    twelfthMark?: number;
    standingArreas?: number;
    historyOfArreas?: number;
    profileCompleted: boolean;
    profileStatus?: 'PENDING' | 'APPROVAL_PENDING' | 'VERIFIED';

    placementStatus?: 'PLACED' | 'UNPLACED' | 'OFFERED';
    photoURL?: string;

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
    location?: string; // Added for UI redesign match
    eligibilityCriteria: {
        minCGPA: number;
        backlogsAllowed: number; // Keeping for backward compatibility (Standing Arrears)
        standingArrears: number;
        historyOfArrears: number;
        sslc: number; // 10th Marks
        hsc: number; // 12th Marks
        branches: string[];
    };
    firstRoundCount?: number; // Number of students required for first round
    deadline: number;
    driveDate: number;
    rounds: string[]; // List of round descriptions
    requirements?: string[]; // List of requirements
    applicants: string[];
    optedOut?: string[];
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

export interface PlacementRecord {
    id: string;
    name: string;
    rollNo: string;
    department: string;
    companyName: string;
    role?: string; // Added to support role display
    package?: string; // Optional (LPA)
    academicYear: string; // e.g. "2023-2027" or just "2026"
    createdAt?: number;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: number; // Stored as timestamp
    authorId: string;
    authorRole: UserRole;
    authorName: string;
    targetDepts: string[]; // Changed from targetDept string to array
}
