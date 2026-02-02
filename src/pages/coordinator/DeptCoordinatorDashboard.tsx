import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { TrainingService } from '../../services/trainingService';
//import { PlacementService } from '../../services/placementService'; // Assuming this service exists

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const DeptCoordinatorDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  const [stats, setStats] = useState({
    totalStudents: 0,
    trainedStudents: 0,
    totalTrainings: 0,
    totalPlaced: 0
  });

  const [deptTrainingChartData, setDeptTrainingChartData] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [placementStatusData, setPlacementStatusData] = useState<any[]>([]);
  const [packageDistributionData, setPackageDistributionData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile?.department) return;

      try {
        // ------------------ Students ------------------
        const allStudents = await UserService.getUsersByRole('STUDENT');
        const deptStudents = allStudents.filter(
          s => s.department === userProfile.department
        );

        // ------------------ Trainings ------------------
        const trainings = await TrainingService.getAllTrainings();

        // ---- Dept-specific training participation ----
        const trainingData: any[] = [];
        const trainedStudentSet = new Set<string>();

        trainings.forEach(training => {
          const count = training.participants?.filter(uid =>
            deptStudents.some(s => s.uid === uid)
          )?.length || 0;

          if (count > 0) {
            trainingData.push({
              training: training.title,
              students: count
            });
            training.participants?.forEach(uid => {
              if (deptStudents.some(s => s.uid === uid)) trainedStudentSet.add(uid);
            });
          }
        });

        setDeptTrainingChartData(trainingData);

        // ---- Monthly Training Chart ----
        const monthMap: Record<string, { trainings: number; students: number }> = {};

        trainings.forEach(training => {
          const month = new Date(training.startDate).toLocaleString('default', {
            month: 'short'
          });

          if (!monthMap[month]) monthMap[month] = { trainings: 0, students: 0 };

          monthMap[month].trainings += 1;

          training.participants?.forEach(uid => {
            if (deptStudents.some(s => s.uid === uid)) monthMap[month].students += 1;
          });
        });

        setMonthlyChartData(
          Object.keys(monthMap).map(month => ({
            month,
            trainings: monthMap[month].trainings,
            students: monthMap[month].students
          }))
        );

        // ---- Placements ----
       /* const placements = await PlacementService.getAllPlacements(); // Assuming it returns list with {uid, company, package}

        const deptPlacements = placements.filter(p =>
          deptStudents.some(s => s.uid === p.uid)
        );

        const placedCount = deptPlacements.length;
        const notPlacedCount = deptStudents.length - placedCount;

        setPlacementStatusData([
          { name: 'Placed', value: placedCount },
          { name: 'Not Placed', value: notPlacedCount }
        ]);

        // ---- Package Distribution ----
        const packageDistribution = {
          'Below 4.5': 0,
          '4.5 - 8': 0,
          '8 - 10': 0,
          'Above 10': 0
        };

        deptPlacements.forEach(p => {
          if (p.package < 4.5) packageDistribution['Below 4.5'] += 1;
          else if (p.package <= 8) packageDistribution['4.5 - 8'] += 1;
          else if (p.package <= 10) packageDistribution['8 - 10'] += 1;
          else packageDistribution['Above 10'] += 1;
        });

        setPackageDistributionData(
          Object.entries(packageDistribution).map(([range, count]) => ({
            range,
            count
          }))
        );*/

        // ---- Stats ----
        setStats({
          totalStudents: deptStudents.length,
          trainedStudents: trainedStudentSet.size,
          totalTrainings: trainings.length,
          totalPlaced: placedCount
        });
      } catch (error) {
        console.error('Dashboard error:', error);
      }
    };

    fetchDashboardData();
  }, [userProfile]);

  const COLORS = ['#22c55e', '#f97316', '#4f46e5', '#e11d48'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Coordinator Dashboard</h1>
        <p className="text-gray-600">{userProfile?.department} Department Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-3xl font-bold mt-2">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Students Trained</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.trainedStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Trainings</p>
          <p className="text-3xl font-bold text-orange-500 mt-2">{stats.totalTrainings}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Placed Students</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalPlaced}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dept Training */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold text-gray-800 mb-4">Department Training Participation</h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ width: deptTrainingChartData.length * 120 + 50 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptTrainingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="training"
                    tick={{ angle: -35, textAnchor: 'end', fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Training Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="trainings" stroke="#f97316" />
              <Line type="monotone" dataKey="students" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Placement Status */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold text-gray-800 mb-4">Placement Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={placementStatusData}
                dataKey="value"
                nameKey="name"
                label
                outerRadius={100}
              >
                {placementStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Package Distribution */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-bold text-gray-800 mb-4">Package Distribution (LPA)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={packageDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DeptCoordinatorDashboard;
