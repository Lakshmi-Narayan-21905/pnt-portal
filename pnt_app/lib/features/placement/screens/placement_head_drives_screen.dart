import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'placement_head_drive_details_screen.dart';

class PlacementHeadDrivesScreen extends StatelessWidget {
  const PlacementHeadDrivesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Company Drives')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/admin/companies/add'), // Reuse admin add screen
        label: const Text('Add Drive'),
        icon: const Icon(LucideIcons.plus),
        backgroundColor: AppTheme.primary600,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('companies').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

          final drives = snapshot.data!.docs;
          if (drives.isEmpty) return const Center(child: Text('No drives found.'));

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: drives.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final drive = drives[index].data() as Map<String, dynamic>;
              return Card(
                child: ListTile(
                  title: Text(drive['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${drive['type'] ?? ''} • ${drive['salary'] ?? ''} LPA'),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PlacementHeadDriveDetailsScreen(
                          companyId: snapshot.data!.docs[index].id,
                          drive: drive,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
