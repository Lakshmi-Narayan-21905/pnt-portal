import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar } from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import type { Company } from '../../types';

const DeptPlacements: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const data = await CompanyService.getAllCompanies();
            // Sort by drive date descending (newest first)
            data.sort((a, b) => b.driveDate - a.driveDate);
            setCompanies(data);
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
                                className="bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/60 hover:shadow-lg hover:shadow-brand-lavender-primary/5 transition cursor-pointer relative group"
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-xs bg-brand-lavender-light text-brand-lavender-deep px-2 py-1 rounded">
                                    Click for details
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-brand-lavender-ice rounded-lg border border-brand-lavender-lilac/20">
                                        <Building2 className="w-6 h-6 text-brand-lavender-primary" />
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${isExpired ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-brand-green-ice text-brand-green-deep border border-brand-green-light'}`}>
                                        {isExpired ? 'Closed' : 'Open'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h3>
                                <p className="text-gray-500 text-sm mb-1">{company.type}</p>
                                <p className="text-gray-500 text-sm mb-4">{company.roles.join(', ')}</p>

                                <div className="flex justify-between items-center border-t border-brand-lavender-lilac/20 pt-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2 text-brand-lavender-purple" />
                                        {new Date(company.driveDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm font-medium text-brand-lavender-deep bg-brand-lavender-light px-3 py-1 rounded-full">
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
