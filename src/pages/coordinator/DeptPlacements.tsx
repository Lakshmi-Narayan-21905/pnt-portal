import React, { useState, useEffect } from 'react';
import { Building2, Calendar } from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import type { Company } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const DeptPlacements: React.FC = () => {
    const { userProfile } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            // Fetch all companies. 
            // NOTE: In a real scenario, we might want to filter only companies 
            // relevant to this department (e.g. where eligibilityCriteria.branches includes dept)
            // For now, showing all active drives as general visibility is usually desired.
            const allCompanies = await CompanyService.getAllCompanies();

            // Optional: Filter by department eligibility if requested.
            // keeping it broad for now, but highlighting if eligible.
            setCompanies(allCompanies);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Company Schedules & Registrations</h1>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.length === 0 && <p className="text-gray-500">No active drives.</p>}
                    {companies.map((company) => {
                        const isEligible = userProfile?.department && company.eligibilityCriteria.branches.includes(userProfile.department);
                        return (
                            <div key={company.id} className={`bg-white p-6 rounded-xl shadow-sm border ${isEligible ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'} hover:shadow-md transition`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${isEligible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {isEligible ? 'Eligible' : 'Other Dept'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h3>
                                <p className="text-gray-500 text-sm mb-1">{company.type}</p>
                                <p className="text-gray-500 text-sm mb-4">{company.roles.join(', ')}</p>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Package: {company.salary}</p>

                                <div className="flex items-center text-sm text-gray-500 border-t pt-4">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(company.driveDate).toLocaleDateString()}
                                </div>

                                <div className="mt-4 pt-2 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Eligibility</h4>
                                    <p className="text-xs text-gray-600 mt-1">Branches: {company.eligibilityCriteria.branches.join(', ')}</p>
                                    <p className="text-xs text-gray-600">Min CGPA: {company.eligibilityCriteria.minCGPA}</p>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-gray-600">
                                        Registrations: <span className="font-bold">{company.applicants?.length || 0}</span>
                                    </p>
                                    {/* Future: Add button to view registered students from this department */}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DeptPlacements;
