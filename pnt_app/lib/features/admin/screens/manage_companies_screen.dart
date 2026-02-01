import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class ManageCompaniesScreen extends StatelessWidget {
  const ManageCompaniesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Companies'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/admin/companies/add');
        },
        label: const Text('Add Drive'),
        icon: const Icon(LucideIcons.plus),
        backgroundColor: AppTheme.primary600,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('companies').orderBy('createdAt', descending: true).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
             return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final companies = snapshot.data!.docs;
          
          if (companies.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   Icon(LucideIcons.building, size: 64, color: Colors.grey[300]),
                   const SizedBox(height: 16),
                   Text('No company drives found', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: companies.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final company = companies[index].data() as Map<String, dynamic>;
              final id = companies[index].id;
              
              DateTime? driveDate;
              // Handle various date formats (Timestamp, String, Number)
              if (company['driveDate'] != null) {
                 if (company['driveDate'] is Timestamp) {
                   driveDate = (company['driveDate'] as Timestamp).toDate();
                 } else if (company['driveDate'] is int) {
                   driveDate = DateTime.fromMillisecondsSinceEpoch(company['driveDate']);
                 } else if (company['driveDate'] is String) {
                   driveDate = DateTime.tryParse(company['driveDate']);
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
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                company['name'] ?? 'Unknown',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 4),
                              if (company['roles'] != null && (company['roles'] as List).isNotEmpty)
                                Text(
                                  (company['roles'] as List).join(', '),
                                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                                ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.trash2, color: Colors.red, size: 20),
                          onPressed: () => _deleteCompany(context, id),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _infoItem(LucideIcons.indianRupee, company['salary'] ?? 'N/A'),
                        _infoItem(LucideIcons.calendar, driveDate != null ? DateFormat('MMM d').format(driveDate) : 'TBA'),
                        _infoItem(LucideIcons.users, '${(company['applicants'] as List?)?.length ?? 0} Reg.'),
                      ],
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

  Widget _infoItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.primary600),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Future<void> _deleteCompany(BuildContext context, String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Drive?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm == true) {
      await FirebaseFirestore.instance.collection('companies').doc(id).delete();
    }
  }
}
