import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../types';
import { UserService } from '../../services/userService';
import { AdminAuthService } from '../../services/adminAuthService';
import { ExcelParser } from '../../utils/excelParser';
import Modal from '../../components/ui/Modal';
import { Plus, Upload } from 'lucide-react';

const ManageHeads: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'PLACEMENT' | 'TRAINING'>('PLACEMENT');
    const [heads, setHeads] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addMethod, setAddMethod] = useState<'MANUAL' | 'EXCEL'>('MANUAL');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [department, setDepartment] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    const fetchHeads = async () => {
        setLoading(true);
        try {
            const role = activeTab === 'PLACEMENT' ? 'PLACEMENT_HEAD' : 'TRAINING_HEAD';
            const data = await UserService.getUsersByRole(role);
            setHeads(data);
        } catch (error) {
            console.error("Error fetching heads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeads();
    }, [activeTab]);

    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage('Creating user...');
        try {
            const user = await AdminAuthService.createUser(email, password);
            if (user) {
                const role = activeTab === 'PLACEMENT' ? 'PLACEMENT_HEAD' : 'TRAINING_HEAD';
                const newProfile: UserProfile = {
                    uid: user.uid,
                    email: user.email!,
                    role: role,
                    displayName: displayName,
                    department: department,
                    profileCompleted: true, // Heads are considered completed for now
                    createdAt: Date.now()
                };
                await UserService.createUserProfile(newProfile);
                setStatusMessage('User created successfully!');
                setIsModalOpen(false);
                fetchHeads();
                resetForm();
            }
        } catch (error: any) {
            setStatusMessage(`Error: ${error.message}`);
        }
    };

    const handleExcelUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setStatusMessage('Parsing Excel...');
        try {
            const users = await ExcelParser.parseUserFile(file);
            setStatusMessage(`Found ${users.length} users. Creating accounts...`);

            let successCount = 0;
            let errorCount = 0;

            for (const userData of users) {
                try {
                    // Assume columns: username (email prefix or full email), password, department, displayName
                    const userEmail = userData.username.includes('@') ? userData.username : `${userData.username}@college.edu`; // Default domain if just username
                    const userPass = userData.password || 'password123';

                    const user = await AdminAuthService.createUser(userEmail, userPass);
                    if (user) {
                        const role = activeTab === 'PLACEMENT' ? 'PLACEMENT_HEAD' : 'TRAINING_HEAD';
                        const newProfile: UserProfile = {
                            uid: user.uid,
                            email: user.email!,
                            role: role,
                            displayName: userData.displayName || userData.username,
                            department: userData.department || '',
                            profileCompleted: true,
                            createdAt: Date.now()
                        };
                        await UserService.createUserProfile(newProfile);
                        successCount++;
                    }
                } catch (err) {
                    console.error("Failed to create user:", userData.username, err);
                    errorCount++;
                }
            }
            setStatusMessage(`Upload Complete. Success: ${successCount}, Failed: ${errorCount}`);
            fetchHeads();
            if (errorCount === 0) {
                setTimeout(() => setIsModalOpen(false), 2000);
            }
        } catch (error: any) {
            setStatusMessage(`Error parsing file: ${error.message}`);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setDisplayName('');
        setDepartment('');
        setFile(null);
        setStatusMessage('');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Heads</h1>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Head
                </button>
            </div>

            <div className="flex space-x-4 mb-6 border-b border-gray-200">
                <button
                    className={`pb-2 px-4 ${activeTab === 'PLACEMENT' ? 'border-b-2 border-primary-500 text-primary-600 font-semibold' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('PLACEMENT')}
                >
                    Placement Heads
                </button>
                <button
                    className={`pb-2 px-4 ${activeTab === 'TRAINING' ? 'border-b-2 border-primary-500 text-primary-600 font-semibold' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('TRAINING')}
                >
                    Training Heads
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {heads.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No heads found.</td>
                                </tr>
                            ) : (
                                heads.map((head) => (
                                    <tr key={head.uid}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <span className="text-primary-600 font-bold">{head.displayName.charAt(0)}</span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{head.displayName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{head.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{head.department || 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Head Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Add ${activeTab === 'PLACEMENT' ? 'Placement' : 'Training'} Head`}
            >
                <div className="mb-4">
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setAddMethod('MANUAL')}
                            className={`flex-1 py-1 px-3 rounded-md text-sm font-medium transition ${addMethod === 'MANUAL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Manual Entry
                        </button>
                        <button
                            onClick={() => setAddMethod('EXCEL')}
                            className={`flex-1 py-1 px-3 rounded-md text-sm font-medium transition ${addMethod === 'EXCEL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Excel Upload
                        </button>
                    </div>

                    {statusMessage && (
                        <div className={`mb-4 px-3 py-2 rounded text-sm ${statusMessage.includes('Error') || statusMessage.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {statusMessage}
                        </div>
                    )}

                    {addMethod === 'MANUAL' ? (
                        <form onSubmit={handleManualAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full btn-primary">Create User</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleExcelUpload} className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <span className="mt-2 block text-sm font-medium text-gray-900">
                                        {file ? file.name : "Click to upload Excel file"}
                                    </span>
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        accept=".xlsx, .xls"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                                <p className="mt-1 text-xs text-gray-500">.xlsx or .xls</p>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                <p className="font-semibold">Expected Columns:</p>
                                <p>username (email prefix), password, department, displayName</p>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full btn-primary"
                                    disabled={!file}
                                >
                                    Upload & Process
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ManageHeads;
