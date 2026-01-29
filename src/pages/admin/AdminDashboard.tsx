import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { TrendingUp, Users, Briefcase, GraduationCap, Award } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { userProfile } = useAuth();

    // Monthly placement trends data
    const placementTrends = [
        { month: 'Aug', placements: 45, applications: 120, offers: 52 },
        { month: 'Sep', placements: 67, applications: 145, offers: 78 },
        { month: 'Oct', placements: 89, applications: 178, offers: 102 },
        { month: 'Nov', placements: 112, applications: 195, offers: 125 },
        { month: 'Dec', placements: 145, applications: 210, offers: 158 },
        { month: 'Jan', placements: 178, applications: 230, offers: 189 },
    ];

    // Department-wise placement data
    const departmentData = [
        { department: 'CSE', placed: 245, total: 280 },
        { department: 'ECE', placed: 198, total: 250 },
        { department: 'Mech', placed: 156, total: 220 },
        { department: 'Civil', placed: 134, total: 200 },
        { department: 'EEE', placed: 178, total: 210 },
        { department: 'IT', placed: 89, total: 104 },
    ];

    // Training completion distribution
    const trainingData = [
        { name: 'Completed', value: 756, color: '#22c55e' },
        { name: 'In Progress', value: 312, color: '#3b82f6' },
        { name: 'Not Started', value: 166, color: '#f59e0b' },
    ];

    // Yearly placement data (academic year)
    const yearlyPlacements = [
        { month: 'Aug', placements: 45 },
        { month: 'Sep', placements: 67 },
        { month: 'Oct', placements: 89 },
        { month: 'Nov', placements: 112 },
        { month: 'Dec', placements: 145 },
        { month: 'Jan', placements: 178 },
        { month: 'Feb', placements: 198 },
        { month: 'Mar', placements: 234 },
        { month: 'Apr', placements: 189 },
        { month: 'May', placements: 156 },
    ];

    // Company type distribution
    const companyTypes = [
        { name: 'Product Based', value: 425, color: '#8b5cf6' },
        { name: 'Service Based', value: 356, color: '#06b6d4' },
        { name: 'Startups', value: 119, color: '#f97316' },
    ];

    const COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];

    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {userProfile?.displayName}</p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Students</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">1,234</p>
                            <p className="text-xs text-gray-400 mt-1">Across all departments</p>
                        </div>
                        <Users className="w-10 h-10 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Placed Students</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">900</p>
                            <p className="text-xs text-gray-400 mt-1">72.9% placement rate</p>
                        </div>
                        <Award className="w-10 h-10 text-green-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Drives</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">18</p>
                            <p className="text-xs text-gray-400 mt-1">12 companies recruiting</p>
                        </div>
                        <Briefcase className="w-10 h-10 text-purple-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Training Programs</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                            <p className="text-xs text-gray-400 mt-1">1,068 enrolled</p>
                        </div>
                        <GraduationCap className="w-10 h-10 text-orange-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg. Package</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">8.4L</p>
                            <p className="text-xs text-gray-400 mt-1">↑ 12% from last year</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-cyan-500" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Placement Trends Line Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Placement Trends (6 Months)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={placementTrends}>
                            <defs>
                                <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="placements" stroke="#22c55e" fillOpacity={1} fill="url(#colorPlacements)" name="Placements" />
                            <Area type="monotone" dataKey="offers" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOffers)" name="Offers" />
                            <Area type="monotone" dataKey="applications" stroke="#3b82f6" fillOpacity={1} fill="url(#colorApplications)" name="Applications" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Department-wise Placements Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Department-wise Placements</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="department" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="placed" fill="#22c55e" name="Placed" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="total" fill="#e5e7eb" name="Total Students" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Training Status Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={trainingData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {trainingData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                        {trainingData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-gray-600">{item.name}</span>
                                </div>
                                <span className="font-semibold text-gray-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Placements Over the Year */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Placements Over the Year</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={yearlyPlacements}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Bar dataKey="placements" fill="#22c55e" radius={[8, 8, 0, 0]} name="Placements">
                                {yearlyPlacements.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${120 + index * 10}, 70%, ${50 - index * 2}%)`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Company Type Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={companyTypes}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {companyTypes.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                        {companyTypes.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-gray-600">{item.name}</span>
                                </div>
                                <span className="font-semibold text-gray-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
