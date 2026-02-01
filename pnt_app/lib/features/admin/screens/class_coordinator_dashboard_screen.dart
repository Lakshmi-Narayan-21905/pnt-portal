import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';
import 'class_coordinator/class_students_screen.dart';

class ClassCoordinatorDashboardScreen extends StatelessWidget {
  const ClassCoordinatorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final userProfile = authService.userProfile;
    final department = userProfile?['department'] ?? 'Unknown';
    final section = userProfile?['section'] ?? userProfile?['class'] ?? 'A'; // 'class' might be used alternatively

    return Scaffold(
      appBar: AppBar(
        title: Text('$department - $section Coordinator'),
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
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Welcome Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4))],
              ),
              child: Column(
                children: [
                  const Icon(LucideIcons.userCheck, size: 48, color: Colors.teal),
                  const SizedBox(height: 16),
                  Text('Welcome, ${userProfile?['displayName'] ?? 'Coordinator'}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 1.2)),
                  const SizedBox(height: 8),
                  Text('Class: $department - $section', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Stats / Actions
            Row(
              children: [
                Expanded(
                  child: _buildActionCard(
                    context,
                    'My Students',
                    LucideIcons.users,
                    Colors.blue,
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => ClassStudentsScreen(department: department, section: section))),
                  ),
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
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
