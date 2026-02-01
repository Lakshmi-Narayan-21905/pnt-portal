import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/students/screens/company_drives_screen.dart';
import '../../features/admin/screens/admin_dashboard_screen.dart';
import '../../features/admin/screens/manage_users_screen.dart';
import '../../features/admin/screens/manage_companies_screen.dart';
import '../../features/admin/screens/add_company_screen.dart';
import '../../features/admin/screens/manage_trainings_screen.dart';
import '../../features/admin/screens/add_training_screen.dart';
import '../../features/placement/screens/placement_students_screen.dart';
import '../../features/students/screens/student_profile_screen.dart';
import '../../features/students/screens/edit_profile_screen.dart';
import '../../features/students/screens/student_trainings_screen.dart';
import '../../features/admin/screens/dept_coordinator_dashboard_screen.dart';
import '../../features/admin/screens/dept_students_screen.dart';
import '../../features/placement/screens/placement_head_dashboard.dart';
import '../../features/training/screens/training_head_dashboard.dart';

final appRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/student/drives',
      builder: (context, state) => const CompanyDrivesScreen(),
    ),
    GoRoute(
      path: '/student/trainings',
      builder: (context, state) => const StudentTrainingsScreen(),
    ),
    GoRoute(
      path: '/admin/users',
      builder: (context, state) => const ManageUsersScreen(),
    ),
    GoRoute(
      path: '/admin/companies',
      builder: (context, state) => const ManageCompaniesScreen(),
    ),
    GoRoute(
      path: '/admin/companies/add',
      builder: (context, state) => const AddCompanyScreen(),
    ),
    GoRoute(
      path: '/admin/trainings',
      builder: (context, state) => const ManageTrainingsScreen(),
    ),
    GoRoute(
      path: '/admin/trainings/add',
      builder: (context, state) => const AddTrainingScreen(),
    ),
    GoRoute(
      path: '/placement/students',
      builder: (context, state) => const PlacementStudentsScreen(),
    ),
    GoRoute(
      path: '/student/profile',
      builder: (context, state) => const StudentProfileScreen(),
    ),
    GoRoute(
      path: '/student/profile/edit',
      builder: (context, state) => const EditProfileScreen(),
    ),
    GoRoute(
      path: '/dept/dashboard',
      builder: (context, state) => const DeptCoordinatorDashboardScreen(),
    ),
    GoRoute(
      path: '/dept/students',
      builder: (context, state) => const DeptStudentsScreen(),
    ),
    GoRoute(
      path: '/placement/dashboard',
      builder: (context, state) => const PlacementHeadDashboardScreen(),
    ),
    GoRoute(
      path: '/training/dashboard',
      builder: (context, state) => const TrainingHeadDashboardScreen(),
    ),
  ],
);
