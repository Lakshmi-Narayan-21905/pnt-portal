import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'training_head_training_details_screen.dart';

class TrainingHeadTrainingsScreen extends StatelessWidget {
  const TrainingHeadTrainingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Trainings')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/admin/trainings/add'), // Reuse admin add screen
        label: const Text('Add Training'),
        icon: const Icon(LucideIcons.plus),
        backgroundColor: AppTheme.primary600,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('trainings').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

          final trainings = snapshot.data!.docs;
          if (trainings.isEmpty) return const Center(child: Text('No trainings found.'));

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: trainings.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final training = trainings[index].data() as Map<String, dynamic>;
              DateTime? date;
              if (training['date'] != null) {
                 date = (training['date'] as Timestamp).toDate();
              }

              return Card(
                child: ListTile(
                  title: Text(training['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${training['trainer'] ?? 'Unknown Trainer'} • ${date != null ? DateFormat('MMM d, y').format(date) : "TBA"}'),
                  trailing: const Icon(LucideIcons.chevronRight),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => TrainingHeadTrainingDetailsScreen(
                          trainingId: snapshot.data!.docs[index].id,
                          training: training,
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
