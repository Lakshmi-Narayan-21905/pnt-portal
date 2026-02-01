import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class CompanyDrivesScreen extends StatelessWidget {
  const CompanyDrivesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Company Drives'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('companies')
            .orderBy('createdAt', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final drives = snapshot.data!.docs;

          if (drives.isEmpty) {
            return const Center(child: Text('No active drives found.'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: drives.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final drive = drives[index].data() as Map<String, dynamic>;
              // Handle Timestamp conversion safely
              DateTime? driveDate;
              if (drive['driveDate'] != null) {
                if (drive['driveDate'] is Timestamp) {
                  driveDate = (drive['driveDate'] as Timestamp).toDate();
                } else if (drive['driveDate'] is String) {
                   driveDate = DateTime.tryParse(drive['driveDate']);
                }
              }

              return Container(
                decoration: AppTheme.glassDecoration,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            drive['companyName'] ?? 'Unknown Company',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary800,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primary100,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            drive['jobRole'] ?? 'N/A',
                            style: const TextStyle(
                              color: AppTheme.primary700,
                              fontWeight: FontWeight.w500,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(LucideIcons.mapPin, drive['location'] ?? 'Remote'),
                    const SizedBox(height: 8),
                    _buildInfoRow(LucideIcons.calendar, driveDate != null ? DateFormat('MMM d, yyyy').format(driveDate) : 'Date TBA'),
                    const SizedBox(height: 8),
                    _buildInfoRow(LucideIcons.indianRupee, '${drive['salary'] ?? 'Not disclosed'} LPA'),
                    
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          // TODO: Navigate to details / Apply
                        },
                        child: const Text('View Details'),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}
