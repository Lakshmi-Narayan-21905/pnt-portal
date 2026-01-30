import React, { useState, useEffect } from 'react';
import { CompanyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';
import type { Company } from '../../types';
import { Briefcase, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const StudentDrives: React.FC = () => {
    const { userProfile } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const data = await CompanyService.getAllCompanies();
            // Sort by drive date descending
            data.sort((a, b) => b.driveDate - a.driveDate);
            setCompanies(data);
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (companyId: string) => {
        if (!userProfile?.uid) return;
        if (!window.confirm("Are you sure you want to 'Opt In' for this drive? This counts as an application.")) return;

        setApplying(companyId);
        try {
            await CompanyService.applyToDrive(companyId, userProfile.uid);
            // Refresh local state
            setCompanies(prev => prev.map(c =>
                c.id === companyId
                    ? { ...c, applicants: [...(c.applicants || []), userProfile.uid] }
                    : c
            ));
            alert("Opted In successfully!");
        } catch (error) {
            console.error("Error opting in:", error);
            alert("Failed to opt in. Please try again.");
        } finally {
            setApplying(null);
        }
    };

    const handleOptOut = async (companyId: string) => {
        if (!userProfile?.uid) return;
        if (!window.confirm("Are you sure you want to 'Opt Out'? You will NOT be able to apply for this drive later.")) return;

        setApplying(companyId);
        try {
            await CompanyService.optOutDrive(companyId, userProfile.uid);
            // Refresh local state
            setCompanies(prev => prev.map(c =>
                c.id === companyId
                    ? { ...c, optedOut: [...(c.optedOut || []), userProfile.uid] }
                    : c
            ));
            alert("Opted Out successfully.");
        } catch (error) {
            console.error("Error opting out:", error);
            alert("Failed to opt out.");
        } finally {
            setApplying(null);
        }
    };

    const isEligible = (company: Company) => {
        if (!userProfile) return { eligible: false, reason: "Profile not loaded" };

        // Basic eligibility checks
        const { cgpa, tenthMark, twelfthMark, department, standingArreas } = userProfile;
        const { minCGPA, sslc, hsc, backlogsAllowed, branches } = company.eligibilityCriteria;

        if ((cgpa || 0) < minCGPA) return { eligible: false, reason: `CGPA < ${minCGPA}` };
        if ((tenthMark || 0) < sslc) return { eligible: false, reason: `10th Mark < ${sslc}%` };
        if ((twelfthMark || 0) < hsc) return { eligible: false, reason: `12th Mark < ${hsc}%` };
        if ((standingArreas || 0) > backlogsAllowed) return { eligible: false, reason: `Arrears > ${backlogsAllowed}` };

        // Branch check (if branches are specified)
        if (branches && branches.length > 0 && department && !branches.includes(department)) {
            return { eligible: false, reason: "Dept mismatch" };
        }

        return { eligible: true };
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading drives...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Briefcase className="mr-3 text-indigo-600" />
                Drives & Opportunities
            </h1>

            {companies.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">No active drives at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {companies.map(company => {
                        const hasApplied = company.applicants?.includes(userProfile?.uid || '');
                        const hasOptedOut = company.optedOut?.includes(userProfile?.uid || '');
                        const { eligible, reason } = isEligible(company);
                        const isExpired = company.deadline < Date.now();

                        return (
                            <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
                                            <p className="text-sm text-gray-500 mt-1">{company.type} • {company.roles.join(', ')}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                {company.salary}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-2 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Drive: {new Date(company.driveDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 prose prose-sm text-gray-600 line-clamp-2">
                                        {company.description}
                                    </div>

                                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                        <div className="flex space-x-4 text-sm text-gray-500">
                                            <span>Min CGPA: {company.eligibilityCriteria.minCGPA}</span>
                                            <span>Deadline: {new Date(company.deadline).toLocaleDateString()}</span>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            {isExpired ? (
                                                <button disabled className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed">
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Expired
                                                </button>
                                            ) : hasApplied ? (
                                                <button disabled className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 cursor-default opacity-80">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Opted In
                                                </button>
                                            ) : hasOptedOut ? (
                                                <button disabled className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-400 cursor-default opacity-80">
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Opted Out
                                                </button>
                                            ) : !eligible ? (
                                                <div className="flex items-center text-red-500 text-sm font-medium cursor-not-allowed" title={reason}>
                                                    <AlertCircle className="w-5 h-5 mr-2" />
                                                    Not Eligible ({reason})
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleApply(company.id)}
                                                        disabled={applying === company.id}
                                                        className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                                    >
                                                        {applying === company.id ? 'Processing...' : 'Opt In'}
                                                    </button>

                                                    <button
                                                        onClick={() => handleOptOut(company.id)}
                                                        disabled={applying === company.id}
                                                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                                                    >
                                                        {applying === company.id ? 'Processing...' : 'Opt Out'}
                                                    </button>

                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentDrives;
