import type { UserProfile, Company } from '../types';

export interface EligibilityResult {
    eligible: boolean;
    reason?: string;
}

export const checkEligibility = (userProfile: UserProfile | null, company: Company): EligibilityResult => {
    if (!userProfile) return { eligible: false, reason: "Profile not loaded" };

    // Basic eligibility checks
    const { cgpa, tenthMark, twelfthMark, department, standingArreas } = userProfile;
    const { minCGPA, sslc, hsc, backlogsAllowed, branches } = company.eligibilityCriteria;

    // Use nullish coalescing to treat missing values as 0 for safe comparison
    const studentCGPA = cgpa ?? 0;
    const student10th = tenthMark ?? 0;
    const student12th = twelfthMark ?? 0;
    const studentArrears = standingArreas ?? 0;

    if (studentCGPA < minCGPA) return { eligible: false, reason: `CGPA < ${minCGPA}` };
    if (student10th < sslc) return { eligible: false, reason: `10th Mark < ${sslc}%` };
    if (student12th < hsc) return { eligible: false, reason: `12th Mark < ${hsc}%` };
    if (studentArrears > backlogsAllowed) return { eligible: false, reason: `Arrears > ${backlogsAllowed}` };

    // Branch check (if branches are specified)
    if (branches && branches.length > 0 && department && !branches.includes(department)) {
        return { eligible: false, reason: "Dept mismatch" };
    }

    return { eligible: true };
};
