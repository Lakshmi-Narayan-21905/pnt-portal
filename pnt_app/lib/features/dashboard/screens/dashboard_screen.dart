import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

import '../../students/screens/student_dashboard.dart';
import '../../admin/screens/admin_dashboard_screen.dart';
import '../../admin/screens/placement_head_dashboard_screen.dart';
import '../../admin/screens/dept_coordinator_dashboard_screen.dart';
import '../../common/screens/placeholder_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    if (authService.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Role-based Dispatch
    final role = authService.userRole?.toLowerCase();
    
    if (role == 'student') {
      return const StudentDashboardScreen();
    }
    
    if (role == 'admin') {
      return const AdminDashboardScreen();
    }

    if (role == 'placement_head') {
      return const PlacementHeadDashboardScreen();
    }

    if (role == 'dept_coordinator') {
      return const DeptCoordinatorDashboardScreen();
    }
    
    if (role == 'class_coordinator') {
        // return const ClassCoordinatorDashboardScreen();
        return const PlaceholderScreen(title: 'Class Coordinator Dashboard'); // TODO: Implement
    }
    
    // Default / Admin Dashboard (Keep existing layout for now or move to AdminDashboardScreen)
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Dashboard',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut),
            onPressed: () async {
              await authService.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF0F9FF), Colors.white],
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Welcome Card
            Container(
              decoration: AppTheme.glassDecoration,
              padding: const EdgeInsets.all(24),
              width: double.infinity,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primary100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          LucideIcons.user,
                          color: AppTheme.primary600,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Welcome back!',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              authService.user?.email ?? 'User',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary900,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Role: ${authService.userRole ?? "None"}', 
                              style: const TextStyle(fontSize: 12, color: Colors.blue),
                            ),
                            if (authService.error != null)
                              Text(
                                authService.error!,
                                style: const TextStyle(fontSize: 10, color: Colors.red),
                                maxLines: 2,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Grid of Stats/Modules
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                children: [
                  _buildDashboardCard(
                    context,
                    'Students',
                    LucideIcons.graduationCap,
                    Colors.orange,
                    '1,234',
                  ),
                  _buildDashboardCard(
                    context,
                    'Companies',
                    LucideIcons.building,
                    Colors.blue,
                    '56',
                  ),
                  _buildDashboardCard(
                    context,
                    'Placements',
                    LucideIcons.briefcase,
                    Colors.green,
                    '89%',
                  ),
                  _buildDashboardCard(
                    context,
                    'Trainings',
                    LucideIcons.bookOpen,
                    Colors.purple,
                    '12',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    String value,
  ) {
    return Container(
      decoration: AppTheme.glassDecoration,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
