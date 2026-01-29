import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';

const CompleteProfile: React.FC = () => {
    const { userProfile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        displayName: userProfile?.displayName || '',
        email: userProfile?.email || '',
        phone: '',
        address: '',
        cgpa: '',
        tenthMark: '',
        twelfthMark: '',
        standingArreas: '',
        historyOfArreas: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.uid) return;

        setSubmitting(true);
        try {
            await UserService.updateUserProfile(userProfile.uid, {
                ...userProfile,
                displayName: formData.displayName, // Allow Name edit? Sure.
                phone: formData.phone,
                address: formData.address,
                cgpa: parseFloat(formData.cgpa),
                tenthMark: parseFloat(formData.tenthMark),
                twelfthMark: parseFloat(formData.twelfthMark),
                standingArreas: parseInt(formData.standingArreas),
                historyOfArreas: parseInt(formData.historyOfArreas),
                profileCompleted: true
            });

            await refreshProfile();
            navigate('/student/dashboard');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Complete Your Profile
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Please provide your academic and personal details.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Personal Details */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" required className="mt-1 block w-full input-field" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Email (Read Only)</label>
                                <input type="email" disabled className="mt-1 block w-full input-field bg-gray-100" value={formData.email} />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input type="tel" required className="mt-1 block w-full input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <textarea required rows={3} className="mt-1 block w-full input-field" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>

                            {/* Academic Details */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">CGPA</label>
                                <input type="number" step="0.01" required className="mt-1 block w-full input-field" value={formData.cgpa} onChange={e => setFormData({ ...formData, cgpa: e.target.value })} />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">10th Mark (%)</label>
                                <input type="number" step="0.1" required className="mt-1 block w-full input-field" value={formData.tenthMark} onChange={e => setFormData({ ...formData, tenthMark: e.target.value })} />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">12th Mark (%)</label>
                                <input type="number" step="0.1" required className="mt-1 block w-full input-field" value={formData.twelfthMark} onChange={e => setFormData({ ...formData, twelfthMark: e.target.value })} />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Standing Arrears</label>
                                <input type="number" required className="mt-1 block w-full input-field" value={formData.standingArreas} onChange={e => setFormData({ ...formData, standingArreas: e.target.value })} />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">History of Arrears</label>
                                <input type="number" required className="mt-1 block w-full input-field" value={formData.historyOfArreas} onChange={e => setFormData({ ...formData, historyOfArreas: e.target.value })} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Complete Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
