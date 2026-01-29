import React, { useState, useEffect } from 'react';
import { Building2, Plus, Calendar, Trash2 } from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import type { Company } from '../../types';
import Modal from '../../components/ui/Modal';
import { DEPARTMENTS } from '../../utils/constants';

const ManageCompanies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        role: '',
        salary: '',
        minCGPA: 0,
        backlogs: 0,
        branches: '', // comma separated input
        deadline: '',
        driveDate: ''
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
                roles: [formData.role], // Keeping it simple for now
                salary: formData.salary,
                eligibilityCriteria: {
                    minCGPA: Number(formData.minCGPA),
                    backlogsAllowed: Number(formData.backlogs),
                    branches: formData.branches.split(',').map(b => b.trim())
                },
                deadline: new Date(formData.deadline).getTime(),
                driveDate: new Date(formData.driveDate).getTime()
            });
            setIsModalOpen(false);
            fetchCompanies();
            // Reset form
            setFormData({
                name: '', description: '', role: '', salary: '', minCGPA: 0, backlogs: 0, branches: '', deadline: '', driveDate: ''
            });
        } catch (error) {
            alert('Failed to add company');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this company?')) {
            await CompanyService.deleteCompany(id);
            fetchCompanies();
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Company Drives</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Company
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading companies...</div>
                ) : companies.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No company drives found. Add one to get started.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {companies.map((company) => (
                            <div key={company.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="p-3 bg-blue-50 rounded-lg mr-3">
                                            <Building2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{company.name}</h3>
                                            <p className="text-sm text-gray-500">{company.roles.join(', ')}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(company.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Package:</span>
                                        <span className="font-medium">{company.salary}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Min CGPA:</span>
                                        <span className="font-medium">{company.eligibilityCriteria.minCGPA}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Drive Date:</span>
                                        <span className="font-medium flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(company.driveDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Company Drive">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <input required placeholder="Company Name" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <input required placeholder="Role (e.g. SDE)" className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} />
                    <textarea required placeholder="Description" className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    <input required placeholder="Salary/Package (e.g. 10 LPA)" className="input-field" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} />

                    <div className="grid grid-cols-2 gap-4">
                        <input required type="number" step="0.1" placeholder="Min CGPA" className="input-field" value={formData.minCGPA} onChange={e => setFormData({ ...formData, minCGPA: Number(e.target.value) })} />
                        <input required type="number" placeholder="Backlogs Allowed" className="input-field" value={formData.backlogs} onChange={e => setFormData({ ...formData, backlogs: Number(e.target.value) })} />
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
                                            className="rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">{dept}</span>
                                    </label>
                                );
                            })}
                        </div>
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

export default ManageCompanies;
