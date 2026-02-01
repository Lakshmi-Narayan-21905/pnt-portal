import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';
import 'dept_coordinator/dept_coordinator_company_drives_screen.dart';
import 'dept_coordinator/dept_coordinator_trainings_screen.dart';
import 'dept_coordinator/dept_class_coordinators_screen.dart';

class DeptCoordinatorDashboardScreen extends StatelessWidget {
  const DeptCoordinatorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final userProfile = authService.userProfile;
    final department = userProfile?['department'] ?? 'Unknown';

    return Scaffold(
      appBar: AppBar(
        title: Text('$department Coordinator'),
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Card
            Container(
              decoration: AppTheme.glassDecoration,
              padding: const EdgeInsets.all(24),
              width: double.infinity,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Text(
                    'Welcome, ${userProfile?['displayName'] ?? 'Coordinator'}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Department: $department',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Stats Grid (Placeholder stats for now)
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                _buildActionCard(
                  context,
                  'My Students',
                  LucideIcons.users,
                  Colors.blue,
                  () => context.push('/dept/students'),
                ),
                _buildActionCard(
                   context,
                  'Company Drives',
                  LucideIcons.building,
                  Colors.purple,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DeptCoordinatorCompanyDrivesScreen())),
                ),
                _buildActionCard(
                  context,
                  'Trainings',
                  LucideIcons.graduationCap,
                  Colors.orange,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DeptCoordinatorTrainingsScreen())),
                ),
                _buildActionCard(
                  context,
                  'Class Coordinators',
                  LucideIcons.userCog,
                  Colors.teal,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => DeptClassCoordinatorsScreen(department: department))),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: AppTheme.glassDecoration,
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
