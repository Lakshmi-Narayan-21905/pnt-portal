import React, { useState, useEffect } from 'react';
import { CompanyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import type { Company } from '../../types';
import { CheckCircle, AlertCircle, Search, RotateCcw, MapPin } from 'lucide-react';
import { checkEligibility } from '../../utils/eligibility';
import { formatDate } from '../../utils/dateUtils';
import Modal from '../../components/Modal';
import { JOB_ROLES } from '../../utils/constants';
import StudentPageContainer from '../../components/student/StudentPageContainer';

const StudentDrives: React.FC = () => {
    const { userProfile } = useAuth();
    const { showAlert, showConfirm } = useAlert();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState<string>(''); // New state for text search
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

            // Filter by Department
            const dept = userProfile?.department;
            const passoutYear = userProfile?.passoutYear;

            const filteredData = data.filter(c => {
                // Filter by Department
                const deptMatch = !dept || (c.eligibilityCriteria?.branches?.length === 0) || c.eligibilityCriteria?.branches?.includes(dept);

                // Filter by Target Year (Passout Year)
                const yearMatch = !c.targetYear || !passoutYear || c.targetYear === passoutYear;

                return deptMatch && yearMatch;
            });

            // Sort by drive date descending
            filteredData.sort((a, b) => b.driveDate - a.driveDate);
            setCompanies(filteredData);
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (companyId: string) => {
        if (!userProfile?.uid) return;
        if (!await showConfirm("Are you sure you want to 'Opt In' for this drive? This counts as an application.", "Confirm Application", "Yes, Opt In")) return;

        setApplying(companyId);
        try {
            await CompanyService.applyToDrive(companyId, userProfile.uid);
            // Refresh local state
            setCompanies(prev => prev.map(c =>
                c.id === companyId
                    ? { ...c, applicants: [...(c.applicants || []), userProfile.uid] }
                    : c
            ));
            await showAlert("Opted In successfully!", "success", "Success");
        } catch (error) {
            console.error("Error opting in:", error);
            await showAlert("Failed to opt in. Please try again.", "error", "Error");
        } finally {
            setApplying(null);
        }
    };

    const handleOptOut = async (companyId: string) => {
        if (!userProfile?.uid) return;
        if (!await showConfirm("Are you sure you want to 'Opt Out'? You will NOT be able to apply for this drive later.", "Confirm Opt-Out", "Yes, Opt Out")) return;

        setApplying(companyId);
        try {
            await CompanyService.optOutDrive(companyId, userProfile.uid);
            // Refresh local state
            setCompanies(prev => prev.map(c =>
                c.id === companyId
                    ? { ...c, optedOut: [...(c.optedOut || []), userProfile.uid] }
                    : c
            ));
            await showAlert("Opted Out successfully.", "success", "Opte Out");
        } catch (error) {
            console.error("Error opting out:", error);
            await showAlert("Failed to opt out.", "error", "Error");
        } finally {
            setApplying(null);
        }
    };

    // Use utility instead of local function
    const filterCompanies = (company: Company) => {
        // 1. Text Search (Name or Role)
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = company.name.toLowerCase().includes(searchLower);
            const roleMatch = company.roles.some(r => r.toLowerCase().includes(searchLower));
            if (!nameMatch && !roleMatch) return false;
        }

        // 2. Role Dropdown Filter
        if (roleFilter && !company.roles.includes(roleFilter)) return false;

        // 3. Salary Filter
        if (minSalaryFilter) {
            const companySalary = parseFloat(company.salary.match(/[\d.]+/)?.[0] || '0');
            const minSalary = parseFloat(minSalaryFilter) || 0;
            if (companySalary < minSalary) return false;
        }

        // 4. Eligibility Filter
        const { eligible } = checkEligibility(userProfile!, company);
        if (eligibilityFilter === 'eligible' && !eligible) return false;
        if (eligibilityFilter === 'not_eligible' && eligible) return false;

        // 5. Status Filter
        const hasApplied = company.applicants?.includes(userProfile?.uid || '');
        const hasOptedOut = company.optedOut?.includes(userProfile?.uid || '');

        if (statusFilter === 'opted_in' && !hasApplied) return false;
        if (statusFilter === 'opted_out' && !hasOptedOut) return false;
        if (statusFilter === 'not_registered' && (hasApplied || hasOptedOut)) return false;

        return true;
    };


    if (loading) return <div className="p-8 text-center text-gray-500">Loading drives...</div>;

    const filteredCompanies = companies.filter(filterCompanies);

    return (
        <StudentPageContainer title="Drives & Opportunities" subtitle="Explore and apply for campus placement drives">
            {/* Search & Filter Bar - Comprehensive & Clean */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-8">
                {/* Top Row: Search */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Search Opportunities</label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search by company or role..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary transition-all text-gray-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                    </div>
                </div>

                {/* Bottom Row: Detailed Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Role Filter */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Role</label>
                        <select
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary appearance-none cursor-pointer"
                            onChange={(e) => setRoleFilter(e.target.value)}
                            value={roleFilter}
                        >
                            <option value="">All Roles</option>
                            {JOB_ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {/* Salary Filter */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Min Salary</label>
                        <input
                            type="number"
                            placeholder="e.g. 5 LPA"
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary"
                            value={minSalaryFilter}
                            onChange={(e) => setMinSalaryFilter(e.target.value)}
                        />
                    </div>

                    {/* Eligibility Filter */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Eligibility</label>
                        <select
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary appearance-none cursor-pointer"
                            value={eligibilityFilter}
                            onChange={(e) => setEligibilityFilter(e.target.value as any)}
                        >
                            <option value="all">All</option>
                            <option value="eligible">Eligible Only</option>
                            <option value="not_eligible">Not Eligible</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">My Status</label>
                        <select
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">All</option>
                            <option value="opted_in">Opted In</option>
                            <option value="opted_out">Opted Out</option>
                            <option value="not_registered">Not Registered</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('');
                                setMinSalaryFilter('');
                                setEligibilityFilter('all');
                                setStatusFilter('all');
                            }}
                            className="w-full h-[42px] border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Drives Grid - Reference Design Match */}
            {filteredCompanies.length === 0 ? (
                <div className="text-center py-20 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm">
                    <div className="bg-gray-50/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No drives found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">We couldn't find any opportunities matching your current filters. Try adjusting them.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCompanies.map((company) => {
                        const { eligible, reasons } = checkEligibility(userProfile!, company);
                        const hasApplied = (company.applicants || []).includes(userProfile!.uid);
                        const hasOptedOut = (company.optedOut || []).includes(userProfile!.uid);
                        const isExpired = Date.now() > company.deadline;

                        return (
                            <div key={company.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:border-blue-200 transition-all duration-300 flex flex-col h-full group">
                                {/* Header: Name & Salary */}
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{company.name}</h3>
                                    <span className="bg-blue-50/80 backdrop-blur-sm text-brand-blue text-sm font-bold px-3 py-1.5 rounded-lg">
                                        {company.salary}
                                    </span>
                                </div>

                                {/* Role */}
                                <p className="text-brand-primary font-medium text-sm mb-4">
                                    {company.roles && company.roles.length > 0 ? company.roles.join(', ') : 'Software Engineer'}
                                </p>

                                {/* Description */}
                                <p className="text-gray-500 text-sm mb-5 line-clamp-2 leading-relaxed">
                                    {company.description || "Join our team to build scalable systems and solve complex problems at scale."}
                                </p>

                                {/* Location */}
                                <div className="flex items-center text-gray-500 text-sm mb-6">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    {company.location || "Bangalore"}
                                </div>

                                {/* Spacer */}
                                <div className="flex-grow"></div>

                                {/* Eligibility Banner */}
                                {eligible ? (
                                    <div className="w-full py-2.5 px-4 rounded-lg mb-6 flex items-center bg-green-50 text-green-700">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-semibold">Eligible</span>
                                    </div>
                                ) : (
                                    <div className="w-full py-3 px-4 rounded-lg mb-6 bg-red-50 text-red-700">
                                        <div className="flex items-center mb-1">
                                            <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                                            <span className="text-sm font-bold text-red-800">Not Eligible</span>
                                        </div>
                                        {/* Show Reasons */}
                                        {reasons && reasons.length > 0 ? (
                                            <ul className="list-disc pl-8 text-xs text-red-600 space-y-0.5 mt-1">
                                                {reasons.map((reason, idx) => (
                                                    <li key={idx}>{reason}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-red-600 ml-6">Criteria not met</p>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons - Grid Layout to match Reference */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Primary Action Button (Left) */}
                                    {isExpired ? (
                                        <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 font-medium rounded-lg text-sm cursor-not-allowed">
                                            Expired
                                        </button>
                                    ) : hasApplied ? (
                                        <button disabled className="w-full py-2.5 bg-gray-100 text-gray-800 font-medium rounded-lg text-sm cursor-default border border-gray-200">
                                            Applied
                                        </button>
                                    ) : hasOptedOut ? (
                                        <button disabled className="w-full py-2.5 bg-red-50 text-red-600 font-medium rounded-lg text-sm cursor-default border border-red-100">
                                            Opted Out
                                        </button>
                                    ) : !eligible ? (
                                        <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 font-medium rounded-lg text-sm cursor-not-allowed">
                                            Not Eligible
                                        </button>
                                    ) : (
                                        <div className="flex gap-2"> {/* Container for potential multiple buttons if needed */}
                                            {/* Standard Opt In */}
                                            <button
                                                onClick={() => handleApply(company.id)}
                                                disabled={applying === company.id}
                                                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm active:translate-y-0.5"
                                            >
                                                {applying === company.id ? '...' : 'Opt In'}
                                            </button>

                                            {/* Opt Out Button (Explicit Text) */}
                                            <button
                                                onClick={() => handleOptOut(company.id)}
                                                className="px-3 py-2.5 bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-100 transition-colors border border-red-100 whitespace-nowrap"
                                                title="Opt Out of this drive"
                                            >
                                                Opt Out
                                            </button>
                                        </div>
                                    )}

                                    {/* View Details Button (Right) */}
                                    <button
                                        onClick={() => setSelectedCompany(company)}
                                        className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium rounded-lg text-sm transition-all shadow-sm"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Details Modal - Kept same logic, just wrapper changed */}
            <Modal
                isOpen={!!selectedCompany}
                onClose={() => setSelectedCompany(null)}
                title={selectedCompany?.name || 'Company Details'}
            >
                {/* ... existing modal content ... */}
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
                                <span className="font-medium text-gray-900">{formatDate(selectedCompany.driveDate)}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-500 text-xs uppercase mb-1">Deadline</span>
                                <span className="font-medium text-red-700">{formatDate(selectedCompany.deadline)}</span>
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
        </StudentPageContainer>
    );
};

export default StudentDrives;
