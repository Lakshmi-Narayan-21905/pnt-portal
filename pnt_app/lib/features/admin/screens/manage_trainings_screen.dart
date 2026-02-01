import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class ManageTrainingsScreen extends StatelessWidget {
  const ManageTrainingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Training Programs'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/admin/trainings/add');
        },
        label: const Text('Add Training'),
        icon: const Icon(LucideIcons.plus),
        backgroundColor: Colors.green, // Differentiate from companies
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('trainings').orderBy('startDate', descending: true).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
             return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final trainings = snapshot.data!.docs;
          
          if (trainings.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   Icon(LucideIcons.graduationCap, size: 64, color: Colors.grey[300]),
                   const SizedBox(height: 16),
                   Text('No training programs found', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: trainings.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final training = trainings[index].data() as Map<String, dynamic>;
              final id = trainings[index].id;
              
              DateTime? startDate;
              DateTime? endDate;

              if (training['startDate'] != null) {
                 startDate = DateTime.fromMillisecondsSinceEpoch(training['startDate']);
              }
              if (training['endDate'] != null) {
                 endDate = DateTime.fromMillisecondsSinceEpoch(training['endDate']);
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
                                training['title'] ?? 'Untitled Training',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Trainer: ${training['trainer'] ?? 'Unknown'}',
                                style: TextStyle(color: Colors.grey[600], fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.trash2, color: Colors.red, size: 20),
                          onPressed: () => _deleteTraining(context, id),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                         _infoItem(LucideIcons.users, '${(training['eligibility']?['branches'] as List?)?.join(', ') ?? 'All'}'),
                         _infoItem(LucideIcons.calendar, startDate != null ? DateFormat('MMM d').format(startDate) : 'TBA'),
                         _infoItem(LucideIcons.checkCircle, '${(training['participants'] as List?)?.length ?? 0} joined'),
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
        Flexible(child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis)),
      ],
    );
  }

  Future<void> _deleteTraining(BuildContext context, String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Training?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm == true) {
      await FirebaseFirestore.instance.collection('trainings').doc(id).delete();
    }
  }
}
