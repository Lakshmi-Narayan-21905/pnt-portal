import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../features/auth/services/auth_service.dart';
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
import '../../features/admin/screens/class_coordinator_dashboard_screen.dart';

class AppRouter {
  final AuthService authService;

  AppRouter(this.authService);

  late final GoRouter router = GoRouter(
    initialLocation: '/login',
    refreshListenable: authService,
    redirect: (context, state) {
      final isLoggedIn = authService.user != null;
      final isLoggingIn = state.uri.toString() == '/login';

      if (!isLoggedIn) {
        return isLoggingIn ? null : '/login';
      }

      // If logged in and at login page, redirect to dashboard based on role
      if (isLoggingIn && !authService.isLoading) {
         final role = authService.userRole;
         if (role == 'admin') return '/admin/dashboard';
         if (role == 'placement_head') return '/placement/dashboard';
         if (role == 'training_head') return '/training/dashboard';
         if (role == 'dept_coordinator') return '/dept/dashboard';
         if (role == 'class_coordinator') return '/class/dashboard';
         return '/dashboard'; // Student
      }

      return null;
    },
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
        path: '/admin/dashboard', // Correct path for admin dashboard
        builder: (context, state) => const AdminDashboardScreen(),
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
      GoRoute(
        path: '/class/dashboard',
        builder: (context, state) => const ClassCoordinatorDashboardScreen(),
      ),
    ],
  );
}
