import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar } from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';
import type { Company } from '../../types';

const DeptPlacements: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const data = await CompanyService.getAllCompanies();
            // Filter companies to only show those with coordinator's department in eligible branches
            const filteredData = data.filter(company => {
                const branches = company.eligibilityCriteria?.branches || [];
                // Show if no branches specified (open to all) or if coordinator's dept is in branches
                return branches.length === 0 || (userProfile?.department && branches.includes(userProfile.department));
            });
            // Sort by drive date descending (newest first)
            filteredData.sort((a, b) => b.driveDate - a.driveDate);
            setCompanies(filteredData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleCardClick = (company: Company) => {
        navigate(`${company.id}`);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Company Schedules & Registrations</h1>

            {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.length === 0 && <p className="text-gray-500">No active drives.</p>}
                    {companies.map((company) => {
                        const isExpired = company.deadline < Date.now();
                        return (
                            <div
                                key={company.id}
                                onClick={() => handleCardClick(company)}
                                className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.15)] hover:border-purple-200 transition-all duration-300 cursor-pointer relative group"
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                    Click for details
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                                        <Building2 className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${isExpired ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                        {isExpired ? 'Closed' : 'Open'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h3>
                                <p className="text-gray-500 text-sm mb-1">{company.type}</p>
                                <p className="text-gray-500 text-sm mb-4">{company.roles.join(', ')}</p>

                                <div className="flex justify-between items-center border-t border-purple-50 pt-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                                        {new Date(company.driveDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                                        {company.salary}
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

export default DeptPlacements;
