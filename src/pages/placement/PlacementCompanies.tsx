import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Calendar } from 'lucide-react';
import { CompanyService } from '../../services/companyService';
import type { Company } from '../../types';
import Modal from '../../components/ui/Modal';
import { DEPARTMENTS, COMPANY_TYPES, JOB_ROLES } from '../../utils/constants';

const PlacementCompanies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dynamic Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        role: '',
        type: '',
        salary: '',
        targetYear: new Date().getFullYear().toString(),
        minCGPA: '',
        sslc: '',
        hsc: '',
        standingArrears: '',
        historyOfArrears: '',
        firstRoundCount: '',
        branches: '',
        deadline: '',
        driveDate: '',
        rounds: [''] as string[],
        requirements: [''] as string[]
    });

    const handleBranchToggle = (dept: string) => {
        const currentBranches = formData.branches ? formData.branches.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (currentBranches.includes(dept)) {
            setFormData({ ...formData, branches: currentBranches.filter(b => b !== dept).join(', ') });
        } else {
            setFormData({ ...formData, branches: [...currentBranches, dept].join(', ') });
        }
    };

    // Dynamic Field Handlers
    const handleAddField = (field: 'requirements' | 'rounds') => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const handleRemoveField = (field: 'requirements' | 'rounds', index: number) => {
        setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
    };

    const handleFieldChange = (field: 'requirements' | 'rounds', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const data = await CompanyService.getAllCompanies();
            // Ensure rounds is an array if coming from legacy data where it might be a string
            // This is a temporary fix for display, but ideally we migrate data.
            // Since we just changed the type locally, we might need a transform if fetching from DB returns strict types
            // But Firestore returns raw JSON, so we can cast.
            const sanitizedData = data.map(d => ({
                ...d,
                rounds: Array.isArray(d.rounds) ? d.rounds : (d.rounds ? [d.rounds] : []),
                requirements: d.requirements || []
            }));
            setCompanies(sanitizedData as Company[]);
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
                salary: `${formData.salary} PA`,
                eligibilityCriteria: {
                    minCGPA: Number(formData.minCGPA),
                    sslc: Number(formData.sslc),
                    hsc: Number(formData.hsc),
                    backlogsAllowed: Number(formData.standingArrears),
                    standingArrears: Number(formData.standingArrears),
                    historyOfArrears: Number(formData.historyOfArrears),
                    branches: formData.branches.split(',').map(b => b.trim())
                },
                firstRoundCount: Number(formData.firstRoundCount),
                deadline: new Date(formData.deadline).getTime(),
                driveDate: new Date(formData.driveDate).getTime(),
                rounds: formData.rounds.filter(r => r.trim() !== ''),
                requirements: formData.requirements.filter(r => r.trim() !== '')
            });
            setIsModalOpen(false);
            fetchCompanies();
            setFormData({
                name: '', description: '', role: '', type: '', salary: '',
                targetYear: new Date().getFullYear().toString(), minCGPA: '', sslc: '', hsc: '',
                standingArrears: '', historyOfArrears: '', firstRoundCount: '',
                branches: '', deadline: '', driveDate: '', rounds: [''], requirements: ['']
            });
        } catch (error) {
            alert('Failed to schedule drive');
        }
    };

    const handleCardClick = (company: Company) => {
        navigate(`${company.id}`);
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
                        <div
                            key={company.id}
                            onClick={() => handleCardClick(company)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer relative group"
                        >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-xs bg-gray-100 px-2 py-1 rounded">
                                Click for details
                            </div>
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

                            <div className="flex justify-between items-center border-t pt-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(company.driveDate).toLocaleDateString()}
                                </div>
                                <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                    {company.applicants?.length || 0} Reg.
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Drive">
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto px-2 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input required className="input-field w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                            <select required className="input-field w-full" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="">Select Type</option>
                                {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select required className="input-field w-full" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="">Select Role</option>
                                {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Batch</label>
                            <input required type="number" placeholder="2026" className="input-field w-full" value={formData.targetYear} onChange={e => setFormData({ ...formData, targetYear: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Salary / Package</label>
                        <div className="flex rounded-md shadow-sm">
                            <input
                                required
                                type="number"
                                placeholder="10"
                                className="input-field flex-1 rounded-r-none border-r-0"
                                value={formData.salary}
                                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                LPA
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea required rows={3} placeholder="Job description and details..." className="input-field w-full" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    {/* Dynamic Rounds */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Interview Rounds</label>
                        {formData.rounds.map((round, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <span className="text-sm font-medium text-gray-500 w-16">Round {index + 1}</span>
                                <input
                                    type="text"
                                    placeholder={`Round ${index + 1} details...`}
                                    className="input-field flex-1"
                                    value={round}
                                    onChange={(e) => handleFieldChange('rounds', index, e.target.value)}
                                    required
                                />
                                {formData.rounds.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveField('rounds', index)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium px-2"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleAddField('rounds')}
                            className="text-sm text-purple-600 font-medium hover:text-purple-800 flex items-center mt-2"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Round
                        </button>
                    </div>

                    {/* Dynamic Requirements */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Requirements & Skills</label>
                        {formData.requirements.map((req, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="e.g. Java, Python, Good Communication..."
                                    className="input-field flex-1"
                                    value={req}
                                    onChange={(e) => handleFieldChange('requirements', index, e.target.value)}
                                />
                                {formData.requirements.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveField('requirements', index)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium px-2"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleAddField('requirements')}
                            className="text-sm text-purple-600 font-medium hover:text-purple-800 flex items-center mt-2"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Requirement
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                        <label className="text-md font-bold text-gray-800 block border-b pb-2">Eligibility Criteria</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Min CGPA</label>
                                <input required type="number" step="0.1" placeholder="0.0" className="input-field w-full" value={formData.minCGPA} onChange={e => setFormData({ ...formData, minCGPA: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">10th Mark (%)</label>
                                <input required type="number" step="1" placeholder="0" className="input-field w-full" value={formData.sslc} onChange={e => setFormData({ ...formData, sslc: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">12th Mark (%)</label>
                                <input required type="number" step="1" placeholder="0" className="input-field w-full" value={formData.hsc} onChange={e => setFormData({ ...formData, hsc: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Standing Arrears</label>
                                <input required type="number" placeholder="0" className="input-field w-full" value={formData.standingArrears} onChange={e => setFormData({ ...formData, standingArrears: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">History of Arrears</label>
                                <input required type="number" placeholder="0" className="input-field w-full" value={formData.historyOfArrears} onChange={e => setFormData({ ...formData, historyOfArrears: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Required Students</label>
                                <input type="number" placeholder="(Optional)" className="input-field w-full" value={formData.firstRoundCount} onChange={e => setFormData({ ...formData, firstRoundCount: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Branches</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto bg-white">
                            {DEPARTMENTS.map(dept => {
                                const isChecked = formData.branches.split(',').map(s => s.trim()).includes(dept);
                                return (
                                    <label key={dept} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                            <input required type="date" className="input-field w-full" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drive Date</label>
                            <input required type="date" className="input-field w-full" value={formData.driveDate} onChange={e => setFormData({ ...formData, driveDate: e.target.value })} />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary mt-6 py-2.5 text-lg shadow-sm">Create Drive</button>
                </form>
            </Modal>


        </div>
    );
};

export default PlacementCompanies;
