import React, { useEffect, useState } from 'react';
import { Users, Building2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { CompanyService } from '../../services/companyService';

const DeptCoordinatorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        placedStudents: 0, // Not fully tracked yet
        totalDrives: 0,
        inTraining: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!userProfile?.department) return;
            try {
                // Fetch all students (filtered in memory or by query, here getting all due to service limitation but filtering in memory)
                // Optimized: create a query based method later. For now, get all.
                const allStudents = await UserService.getUsersByRole('STUDENT');
                const deptStudents = allStudents.filter(u => u.department === userProfile.department);
                const companies = await CompanyService.getAllCompanies();
                const placed = deptStudents.filter(s => s.placementStatus === 'PLACED').length;

                setStats({
                    totalStudents: deptStudents.length,
                    placedStudents: placed,
                    totalDrives: companies.length,
                    inTraining: 0
                });

            } catch (error) {
                console.error("Error fetching dept stats:", error);
            }
        };
        fetchStats();
    }, [userProfile]);

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.displayName}</p>
                <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">{userProfile?.department} Department</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center hover:shadow-[0_8px_24px_rgba(168,85,247,0.15)] hover:border-purple-200 transition-all duration-300 group">
                    <div className="p-4 bg-purple-50 rounded-xl shadow-sm mr-4 group-hover:bg-purple-100 transition-colors">
                        <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-purple-900/70 text-sm font-bold uppercase tracking-wider">Total Students</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center hover:shadow-[0_8px_24px_rgba(168,85,247,0.15)] hover:border-purple-200 transition-all duration-300 group">
                    <div className="p-4 bg-purple-50 rounded-xl shadow-sm mr-4 group-hover:bg-purple-100 transition-colors">
                        <Building2 className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-purple-900/70 text-sm font-bold uppercase tracking-wider">Placed</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.placedStudents}</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center hover:shadow-[0_8px_24px_rgba(168,85,247,0.15)] hover:border-purple-200 transition-all duration-300 group">
                    <div className="p-4 bg-purple-50 rounded-xl shadow-sm mr-4 group-hover:bg-purple-100 transition-colors">
                        <GraduationCap className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-purple-900/70 text-sm font-bold uppercase tracking-wider">In Training</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inTraining}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeptCoordinatorDashboard;
