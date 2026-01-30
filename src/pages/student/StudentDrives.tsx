import React, { useState, useEffect } from 'react';
import { CompanyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';
import type { Company } from '../../types';
import { Briefcase, Calendar, CheckCircle, XCircle, AlertCircle, Info, Filter } from 'lucide-react';
import { checkEligibility } from '../../utils/eligibility';
import Modal from '../../components/Modal';
import { JOB_ROLES } from '../../utils/constants';

const StudentDrives: React.FC = () => {
    const { userProfile } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    // Filters
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [minSalaryFilter, setMinSalaryFilter] = useState<string>('');
    const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'eligible' | 'not_eligible'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'opted_in' | 'opted_out' | 'not_registered'>('all');

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

    // Use utility instead of local function
    // const isEligible = ... (removed)

    if (loading) return <div className="p-8 text-center text-gray-500">Loading drives...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Briefcase className="mr-3 text-indigo-600" />
                Drives & Opportunities
            </h1>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center mb-3">
                    <Filter className="w-4 h-4 text-indigo-600 mr-2" />
                    <h2 className="text-sm font-semibold text-gray-700">Filter Opportunities</h2>
                    <button
                        onClick={() => {
                            setRoleFilter('');
                            setMinSalaryFilter('');
                            setEligibilityFilter('all');
                            setStatusFilter('all');
                        }}
                        className="ml-auto text-xs text-indigo-600 hover:text-indigo-800"
                    >
                        Reset Filters
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Role Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Job Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Roles</option>
                            {JOB_ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {/* Salary Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Min Salary (LPA)</label>
                        <input
                            type="text"
                            placeholder="e.g. 5"
                            value={minSalaryFilter}
                            onChange={(e) => setMinSalaryFilter(e.target.value)}
                            className="w-full pl-2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Eligibility Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Eligibility</label>
                        <select
                            value={eligibilityFilter}
                            onChange={(e) => setEligibilityFilter(e.target.value as any)}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">Check All</option>
                            <option value="eligible">Eligible Only</option>
                            <option value="not_eligible">Not Eligible</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">My Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="opted_in">Opted In</option>
                            <option value="opted_out">Opted Out</option>
                            <option value="not_registered">Not Registered</option>
                        </select>
                    </div>
                </div>
            </div>

            {companies.filter(company => {
                // Role Filter
                if (roleFilter && !company.roles.includes(roleFilter)) return false;

                // Salary Filter (Heuristic: extract first number)
                if (minSalaryFilter) {
                    const companySalary = parseFloat(company.salary.match(/[\d.]+/)?.[0] || '0');
                    const minSalary = parseFloat(minSalaryFilter) || 0;
                    if (companySalary < minSalary) return false;
                }

                // Eligibility Filter
                const { eligible } = checkEligibility(userProfile, company);
                if (eligibilityFilter === 'eligible' && !eligible) return false;
                if (eligibilityFilter === 'not_eligible' && eligible) return false;

                // Status Filter
                const hasApplied = company.applicants?.includes(userProfile?.uid || '');
                const hasOptedOut = company.optedOut?.includes(userProfile?.uid || '');

                if (statusFilter === 'opted_in' && !hasApplied) return false;
                if (statusFilter === 'opted_out' && !hasOptedOut) return false;
                if (statusFilter === 'not_registered' && (hasApplied || hasOptedOut)) return false;

                return true;
            }).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">No drives match your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {companies.filter(company => {
                        // Role Filter
                        if (roleFilter && !company.roles.includes(roleFilter)) return false;

                        // Salary Filter
                        if (minSalaryFilter) {
                            const companySalary = parseFloat(company.salary.match(/[\d.]+/)?.[0] || '0');
                            const minSalary = parseFloat(minSalaryFilter) || 0;
                            if (companySalary < minSalary) return false;
                        }

                        // Eligibility Filter
                        const { eligible } = checkEligibility(userProfile, company);
                        if (eligibilityFilter === 'eligible' && !eligible) return false;
                        if (eligibilityFilter === 'not_eligible' && eligible) return false;

                        // Status Filter
                        const hasApplied = company.applicants?.includes(userProfile?.uid || '');
                        const hasOptedOut = company.optedOut?.includes(userProfile?.uid || '');

                        if (statusFilter === 'opted_in' && !hasApplied) return false;
                        if (statusFilter === 'opted_out' && !hasOptedOut) return false;
                        if (statusFilter === 'not_registered' && (hasApplied || hasOptedOut)) return false;

                        return true;
                    }).map(company => {
                        const hasApplied = company.applicants?.includes(userProfile?.uid || '');
                        const hasOptedOut = company.optedOut?.includes(userProfile?.uid || '');
                        const { eligible, reason } = checkEligibility(userProfile, company);
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
                                            <button
                                                onClick={() => setSelectedCompany(company)}
                                                className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-4"
                                            >
                                                <Info className="w-4 h-4 mr-1" />
                                                View Details
                                            </button>

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

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedCompany}
                onClose={() => setSelectedCompany(null)}
                title={selectedCompany?.name || 'Company Details'}
            >
                {selectedCompany && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-500 text-xs uppercase mb-1">Type</span>
                                <span className="font-medium text-gray-900">{selectedCompany.type}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-500 text-xs uppercase mb-1">Salary / Package</span>
                                <span className="font-medium text-green-700">{selectedCompany.salary}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-500 text-xs uppercase mb-1">Drive Date</span>
                                <span className="font-medium text-gray-900">{new Date(selectedCompany.driveDate).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-500 text-xs uppercase mb-1">Deadline</span>
                                <span className="font-medium text-red-700">{new Date(selectedCompany.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedCompany.description}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Roles</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedCompany.roles.map((role, i) => (
                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {selectedCompany.requirements && selectedCompany.requirements.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Key Requirements</h4>
                                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                                    {selectedCompany.requirements.map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedCompany.rounds && selectedCompany.rounds.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Selection Process (Rounds)</h4>
                                <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
                                    {selectedCompany.rounds.map((round, i) => (
                                        <li key={i}>{round}</li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Eligibility Criteria</h4>
                            <div className="bg-orange-50 rounded-lg p-4 text-sm text-orange-900 grid grid-cols-2 gap-y-2">
                                <div>Min CGPA: <span className="font-bold">{selectedCompany.eligibilityCriteria.minCGPA}</span></div>
                                <div>History of Arrears: <span className="font-bold">{selectedCompany.eligibilityCriteria.historyOfArrears}</span></div>
                                <div>Standing Arrears: <span className="font-bold">{selectedCompany.eligibilityCriteria.standingArrears}</span></div>
                                <div>10th Mark: <span className="font-bold">{selectedCompany.eligibilityCriteria.sslc}%</span></div>
                                <div>12th Mark: <span className="font-bold">{selectedCompany.eligibilityCriteria.hsc}%</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentDrives;
