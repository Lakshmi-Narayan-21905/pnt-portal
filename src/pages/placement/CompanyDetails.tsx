import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompanyService } from '../../services/companyService';
import { UserService } from '../../services/userService';
import type { Company, UserProfile } from '../../types';
import { DEPARTMENTS } from '../../utils/constants';
import { ArrowLeft, Building2, Calendar } from 'lucide-react';

const CompanyDetails: React.FC = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<UserProfile[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Filters
    const [filterEligibility, setFilterEligibility] = useState<'eligible' | 'not_eligible'>('eligible');
    const [filterStatus, setFilterStatus] = useState<'all' | 'opted_in' | 'opted_out' | 'not_registered'>('all');
    const [filterDept, setFilterDept] = useState<string>('');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!companyId) return;
            try {
                const companies = await CompanyService.getAllCompanies();
                const found = companies.find(c => c.id === companyId);

                if (found) {
                    const sanitized = {
                        ...found,
                        rounds: Array.isArray(found.rounds) ? found.rounds : (found.rounds ? [found.rounds] : []),
                        requirements: found.requirements || []
                    } as Company;
                    setCompany(sanitized);
                    fetchCompanyStudents(sanitized);
                } else {
                    console.error("Company not found");
                }
            } catch (error) {
                console.error("Error fetching company:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [companyId]);

    const fetchCompanyStudents = async (targetCompany: Company) => {
        setLoadingStudents(true);
        try {
            const students = await UserService.getUsersByRole('STUDENT');
            setAllStudents(students);
            // Apply initial filters
            applyFilters(students, targetCompany, 'eligible', 'all', '');
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const checkEligibility = (student: UserProfile, targetCompany: Company) => {
        const criteria = targetCompany.eligibilityCriteria;
        if (!criteria) return true;

        if (criteria.branches && criteria.branches.length > 0 && student.department) {
            if (!criteria.branches.includes(student.department)) return false;
        }
        if (student.cgpa !== undefined && criteria.minCGPA && student.cgpa < criteria.minCGPA) return false;
        if (student.tenthMark !== undefined && criteria.sslc && student.tenthMark < criteria.sslc) return false;
        if (student.twelfthMark !== undefined && criteria.hsc && student.twelfthMark < criteria.hsc) return false;
        if (student.standingArreas !== undefined && criteria.standingArrears !== undefined && student.standingArreas > criteria.standingArrears) return false;
        if (student.historyOfArreas !== undefined && criteria.historyOfArrears !== undefined && student.historyOfArreas > criteria.historyOfArrears) return false;

        return true;
    };

    const applyFilters = (
        students: UserProfile[],
        comp: Company | null,
        eligibility: 'eligible' | 'not_eligible',
        status: 'all' | 'opted_in' | 'opted_out' | 'not_registered',
        dept: string
    ) => {
        if (!comp) return;

        let result = students;

        // Eligibility Filter
        result = result.filter(s => {
            const isEligible = checkEligibility(s, comp);
            return eligibility === 'eligible' ? isEligible : !isEligible;
        });

        // Status Filter
        if (status !== 'all') {
            result = result.filter(s => {
                const isOptedIn = comp.applicants?.includes(s.uid);
                const isOptedOut = comp.optedOut?.includes(s.uid);

                if (status === 'opted_in') return isOptedIn;
                if (status === 'opted_out') return isOptedOut;
                if (status === 'not_registered') return !isOptedIn && !isOptedOut;
                return true;
            });
        }

        // Dept Filter
        if (dept) {
            result = result.filter(s => s.department === dept);
        }

        setFilteredStudents(result);
    };

    // Re-apply filters when filter state changes
    useEffect(() => {
        if (company) {
            applyFilters(allStudents, company, filterEligibility, filterStatus, filterDept);
        }
    }, [filterEligibility, filterStatus, filterDept, allStudents, company]);


    if (loading) {
        return <div className="p-6 text-center">Loading details...</div>;
    }

    if (!company) {
        return (
            <div className="p-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </button>
                <div className="text-center text-red-500">Company not found.</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition">
                <ArrowLeft className="w-5 h-5 mr-1" /> Back to Drives
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                            <span className="px-3 py-1 text-sm rounded-full font-medium bg-green-100 text-green-700">Open</span>
                        </div>
                        <p className="text-gray-500">{company.type} • {company.roles.join(', ')}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <p className="text-2xl font-bold text-gray-900">{company.salary}</p>
                        <p className="text-sm text-gray-500">Package</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Drive Date</p>
                            <p className="font-medium">{new Date(company.driveDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase block mb-1">Deadline</p>
                        <p className="font-medium">{new Date(company.deadline).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase block mb-1">Target Batch</p>
                        <p className="font-medium">{company.targetYear}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase block mb-1">Min CGPA</p>
                        <p className="font-medium">{company.eligibilityCriteria.minCGPA}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{company.description}</p>
                </div>

                <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="font-bold text-gray-800 mb-3">Eligibility Criteria</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">10th Mark</p>
                            <p className="font-medium">{company.eligibilityCriteria.sslc}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">12th Mark</p>
                            <p className="font-medium">{company.eligibilityCriteria.hsc}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Standing Arrears</p>
                            <p className="font-medium">{company.eligibilityCriteria.standingArrears}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">History of Arrears</p>
                            <p className="font-medium">{company.eligibilityCriteria.historyOfArrears}</p>
                        </div>
                    </div>
                    {company.eligibilityCriteria.branches && company.eligibilityCriteria.branches.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Eligible Branches</p>
                            <div className="flex flex-wrap gap-2">
                                {company.eligibilityCriteria.branches.map(branch => (
                                    <span key={branch} className="bg-white text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                                        {branch}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Rounds</h3>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {company.rounds.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Requirements</h3>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {company.requirements?.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Eligibility</label>
                        <select
                            className="input-field w-full mt-1"
                            value={filterEligibility}
                            onChange={(e) => setFilterEligibility(e.target.value as any)}
                        >
                            <option value="eligible">Eligible Only</option>
                            <option value="not_eligible">Not Eligible</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Application Status</label>
                        <select
                            className="input-field w-full mt-1"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="opted_in">Opted In</option>
                            <option value="opted_out">Opted Out</option>
                            <option value="not_registered">Not Registered</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                        <select
                            className="input-field w-full mt-1"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800">Student List ({filteredStudents.length})</h2>
                    {loadingStudents && <span className="text-sm text-gray-500">Updating...</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students match the current filters.</td></tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const isOptedIn = company.applicants?.includes(student.uid);
                                    const isOptedOut = company.optedOut?.includes(student.uid);

                                    return (
                                        <tr key={student.uid} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{student.displayName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.cgpa || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isOptedIn ? (
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Opted In
                                                    </span>
                                                ) : isOptedOut ? (
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                        Opted Out
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        Not Registered
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetails;
