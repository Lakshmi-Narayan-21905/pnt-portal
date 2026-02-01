import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../placement/screens/coordinators_list_screen.dart'; // Reuse existing screen
import 'training_head_trainings_screen.dart';
import 'training_head_students_screen.dart';

class TrainingHeadDashboardScreen extends StatefulWidget {
  const TrainingHeadDashboardScreen({super.key});

  @override
  State<TrainingHeadDashboardScreen> createState() => _TrainingHeadDashboardScreenState();
}

class _TrainingHeadDashboardScreenState extends State<TrainingHeadDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      TrainingHeadHomeTab(onTabChange: (index) => setState(() => _currentIndex = index)),
      const CoordinatorsListScreen(),
      const TrainingHeadTrainingsScreen(),
      const TrainingHeadStudentsScreen(),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(LucideIcons.layoutDashboard), label: 'Home'),
          NavigationDestination(icon: Icon(LucideIcons.users), label: 'Coords'),
          NavigationDestination(icon: Icon(LucideIcons.bookOpen), label: 'Trainings'),
          NavigationDestination(icon: Icon(LucideIcons.graduationCap), label: 'Students'),
        ],
      ),
    );
  }
}

class TrainingHeadHomeTab extends StatelessWidget {
  final Function(int) onTabChange;
  const TrainingHeadHomeTab({super.key, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF0F9FF),
        elevation: 0,
        title: const Text('Training Head Portal', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, color: Colors.black54),
            onPressed: () {
              Provider.of<AuthService>(context, listen: false).signOut();
              context.go('/login');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Hero
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
                  const Icon(LucideIcons.presentation, size: 48, color: Colors.purple),
                  const SizedBox(height: 16),
                  const Text('Training Head\nDashboard', textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 1.2)),
                  const SizedBox(height: 8),
                  Text('Manage trainings, attendance, and\nstudent progress.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Grid
            Row(
              children: [
                Expanded(
                  child: _buildActionCard(
                    icon: LucideIcons.bookOpen,
                    iconColor: Colors.purple,
                    iconBg: Colors.purple.withOpacity(0.1),
                    label: 'Manage Trainings',
                    onTap: () => onTabChange(2),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildActionCard(
                    icon: LucideIcons.graduationCap,
                    iconColor: Colors.orange,
                    iconBg: Colors.orange.withOpacity(0.1),
                    label: 'Students',
                    onTap: () => onTabChange(3),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),
             
             Row(
              children: [
                 Expanded(
                  child: _buildActionCard(
                    icon: LucideIcons.users,
                    iconColor: Colors.blue,
                    iconBg: Colors.blue.withOpacity(0.1),
                    label: 'Coordinators',
                    onTap: () => onTabChange(1), // Switch to Coords Tab
                  ),
                ),
                // Expanded(child: Container()), 
                const SizedBox(width: 16),
                const Spacer(), // Placeholder for future item
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(height: 12),
            Text(
              label, 
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
