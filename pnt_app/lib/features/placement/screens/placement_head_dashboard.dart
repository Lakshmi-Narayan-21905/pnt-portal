import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import 'coordinators_list_screen.dart';
import 'placement_head_drives_screen.dart';
import 'placement_head_students_screen.dart';
import 'placement_records_screen.dart';

class PlacementHeadDashboardScreen extends StatefulWidget {
  const PlacementHeadDashboardScreen({super.key});

  @override
  State<PlacementHeadDashboardScreen> createState() => _PlacementHeadDashboardScreenState();
}

class _PlacementHeadDashboardScreenState extends State<PlacementHeadDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    // We pass the tab switcher callback to the Home Tab so it can switch tabs
    final List<Widget> screens = [
      PlacementHeadHomeTab(onTabChange: (index) => setState(() => _currentIndex = index)),
      const CoordinatorsListScreen(),
      const PlacementHeadDrivesScreen(),
      const PlacementHeadStudentsScreen(),
      const PlacementRecordsScreen(),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(LucideIcons.layoutDashboard), label: 'Home'),
          NavigationDestination(icon: Icon(LucideIcons.users), label: 'Coords'),
          NavigationDestination(icon: Icon(LucideIcons.building), label: 'Drives'),
          NavigationDestination(icon: Icon(LucideIcons.graduationCap), label: 'Students'),
          NavigationDestination(icon: Icon(LucideIcons.clipboardList), label: 'Records'),
        ],
      ),
    );
  }
}

class PlacementHeadHomeTab extends StatelessWidget {
  final Function(int) onTabChange;
  const PlacementHeadHomeTab({super.key, required this.onTabChange});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF), // Light blue bg
      appBar: AppBar(
        backgroundColor: const Color(0xFFF0F9FF),
        elevation: 0,
        title: const Text('Placement Head Portal', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
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
            // Hero Card
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
                  const Icon(LucideIcons.briefcase, size: 48, color: Color(0xFF0288D1)),
                  const SizedBox(height: 16),
                  const Text('Placement Head\nDashboard', textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 1.2)),
                  const SizedBox(height: 8),
                  Text('Manage coordinators, drives, and\nstudent records.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Grid Actions
            Row(
              children: [
                Expanded(
                  child: _buildActionCard(
                    icon: LucideIcons.building,
                    iconColor: const Color(0xFF0288D1),
                    iconBg: const Color(0xFFE1F5FE),
                    label: 'Manage Drives',
                    onTap: () => onTabChange(2), // Switch to Drives Tab
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildActionCard(
                    icon: LucideIcons.users,
                    iconColor: const Color(0xFFF57C00),
                    iconBg: const Color(0xFFFFF3E0),
                    label: 'Students',
                    onTap: () => onTabChange(3), // Switch to Students Tab
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
                    iconColor: Colors.purple,
                    iconBg: Colors.purple.withOpacity(0.1),
                    label: 'Coordinators',
                    onTap: () => onTabChange(1), // Switch to Coords Tab
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildActionCard(
                    icon: LucideIcons.clipboardList,
                    iconColor: Colors.green,
                    iconBg: Colors.green.withOpacity(0.1),
                    label: 'Records',
                    onTap: () => onTabChange(4), // Switch to Records Tab
                  ),
                ),
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
