
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Calendar } from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import type { Company } from '../../types';
import Modal from '../../components/ui/Modal';
import { DEPARTMENTS, COMPANY_TYPES, JOB_ROLES } from '../../utils/constants';

const PlacementCompanies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        role: '',
        type: '',
        salary: '',
        targetYear: new Date().getFullYear(),
        minCGPA: 0,
        sslc: 0,
        hsc: 0,
        backlogs: 0,
        branches: '',
        deadline: '',
        driveDate: '',
        rounds: ''
    });

    const handleBranchToggle = (dept: string) => {
        const currentBranches = formData.branches ? formData.branches.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (currentBranches.includes(dept)) {
            setFormData({ ...formData, branches: currentBranches.filter(b => b !== dept).join(', ') });
        } else {
            setFormData({ ...formData, branches: [...currentBranches, dept].join(', ') });
        }
    };

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const data = await CompanyService.getAllCompanies();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await CompanyService.addCompany({
                name: formData.name,
                description: formData.description,
                roles: [formData.role],
                type: formData.type,
                targetYear: Number(formData.targetYear),
                salary: formData.salary,
                eligibilityCriteria: {
                    minCGPA: Number(formData.minCGPA),
                    sslc: Number(formData.sslc),
                    hsc: Number(formData.hsc),
                    backlogsAllowed: Number(formData.backlogs),
                    branches: formData.branches.split(',').map(b => b.trim())
                },
                deadline: new Date(formData.deadline).getTime(),
                driveDate: new Date(formData.driveDate).getTime(),
                rounds: formData.rounds
            });
            setIsModalOpen(false);
            fetchCompanies();
            setFormData({
                name: '', description: '', role: '', type: '', salary: '',
                targetYear: new Date().getFullYear(), minCGPA: 0, sslc: 0, hsc: 0,
                backlogs: 0, branches: '', deadline: '', driveDate: '', rounds: ''
            });
        } catch (error) {
            alert('Failed to schedule drive');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Company Drives</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Schedule Drive
                </button>
            </div>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.length === 0 && <p className="text-gray-500">No active drives.</p>}
                    {companies.map((company) => (
                        <div key={company.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700`}>
                                    Open
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
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Drive">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Company Name" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <select required className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                            <option value="">Company Type</option>
                            {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <select required className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="">Select Role</option>
                            {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input required type="number" placeholder="Target Year (e.g., 2026)" className="input-field" value={formData.targetYear} onChange={e => setFormData({ ...formData, targetYear: Number(e.target.value) })} />
                    </div>

                    <input required placeholder="Salary/Package (e.g. 10 LPA)" className="input-field" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} />

                    <textarea required placeholder="Description" className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    <textarea required placeholder="Rounds Details" className="input-field" value={formData.rounds} onChange={e => setFormData({ ...formData, rounds: e.target.value })} />

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Eligibility Criteria</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input required type="number" step="0.1" placeholder="Min CGPA" className="input-field" value={formData.minCGPA} onChange={e => setFormData({ ...formData, minCGPA: Number(e.target.value) })} />
                            <input required type="number" placeholder="Backlogs Allowed" className="input-field" value={formData.backlogs} onChange={e => setFormData({ ...formData, backlogs: Number(e.target.value) })} />
                            <input required type="number" step="1" placeholder="10th Mark (%)" className="input-field" value={formData.sslc} onChange={e => setFormData({ ...formData, sslc: Number(e.target.value) })} />
                            <input required type="number" step="1" placeholder="12th Mark (%)" className="input-field" value={formData.hsc} onChange={e => setFormData({ ...formData, hsc: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Branches</label>
                        <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                            {DEPARTMENTS.map(dept => {
                                const isChecked = formData.branches.split(',').map(s => s.trim()).includes(dept);
                                return (
                                    <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleBranchToggle(dept)}
                                            className="rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">{dept}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Selected: {formData.branches || 'None'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500">Application Deadline</label>
                            <input required type="date" className="input-field" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Drive Date</label>
                            <input required type="date" className="input-field" value={formData.driveDate} onChange={e => setFormData({ ...formData, driveDate: e.target.value })} />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary mt-4">Create Drive</button>
                </form>
            </Modal>
        </div>
    );
};

export default PlacementCompanies;
