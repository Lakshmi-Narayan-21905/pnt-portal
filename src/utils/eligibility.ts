import type { UserProfile, Company } from '../types';

export interface EligibilityResult {
    eligible: boolean;
    reasons: string[];
}

export const checkEligibility = (userProfile: UserProfile | null, company: Company): EligibilityResult => {
    if (!userProfile) return { eligible: false, reasons: ["Profile not loaded"] };

    const reasons: string[] = [];

    // Basic eligibility checks
    const { cgpa, tenthMark, twelfthMark, department, standingArreas, historyOfArreas } = userProfile;
    const { minCGPA, sslc, hsc, backlogsAllowed, historyOfArrearsAllowed, branches } = company.eligibilityCriteria;

    // Use nullish coalescing to treat missing values as 0 for safe comparison
    const studentCGPA = cgpa ?? 0;
    const student10th = tenthMark ?? 0;
    const student12th = twelfthMark ?? 0;
    const studentArrears = standingArreas ?? 0;
    const studentHistoryArrears = historyOfArreas ?? 0;

    if (studentCGPA < minCGPA) reasons.push(`CGPA is ${studentCGPA} (Min: ${minCGPA})`);
    if (student10th < sslc) reasons.push(`10th Mark is ${student10th}% (Min: ${sslc}%)`);
    if (student12th < hsc) reasons.push(`12th Mark is ${student12th}% (Min: ${hsc}%)`);
    if (studentArrears > backlogsAllowed) reasons.push(`Standing Arrears: ${studentArrears} (Max: ${backlogsAllowed})`);

    // New check if company has history of arrears criteria
    if (historyOfArrearsAllowed !== undefined && studentHistoryArrears > historyOfArrearsAllowed) {
        reasons.push(`History of Arrears: ${studentHistoryArrears} (Max: ${historyOfArrearsAllowed})`);
    }

    // Branch check (if branches are specified)
    if (branches && branches.length > 0 && department && !branches.includes(department)) {
        reasons.push(`Department ${department} is not eligible`);
    }

    return {
        eligible: reasons.length === 0,
        reasons
    };
};
