import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class StudentTrainingsScreen extends StatelessWidget {
  const StudentTrainingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userProfile = Provider.of<AuthService>(context).userProfile;

    return Scaffold(
      appBar: AppBar(title: const Text('Training Programs')),
      body: userProfile == null
          ? const Center(child: CircularProgressIndicator())
          : StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance.collection('trainings').snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
                if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

                final trainings = snapshot.data!.docs;
                if (trainings.isEmpty) return const Center(child: Text('No trainings available.'));

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: trainings.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final trainingDoc = trainings[index];
                    final training = trainingDoc.data() as Map<String, dynamic>;
                    return _buildTrainingCard(context, trainingDoc.id, training, userProfile['uid']);
                  },
                );
              },
            ),
    );
  }

  Widget _buildTrainingCard(BuildContext context, String trainingId, Map<String, dynamic> training, String uid) {
    // Parse Dates
    DateTime? startDate;
    if (training['startDate'] is int) startDate = DateTime.fromMillisecondsSinceEpoch(training['startDate']);
    
    DateTime? endDate;
    if (training['endDate'] is int) endDate = DateTime.fromMillisecondsSinceEpoch(training['endDate']);

    // Check Status
    final participants = training['participants'] as List? ?? [];
    final isRegistered = participants.contains(uid);

    // Dynamic Badges
    final eligibility = training['eligibility'] as Map<String, dynamic>? ?? {};
    final year = eligibility['year']?.toString() ?? 'All';

    return Container(
      decoration: AppTheme.glassDecoration,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      training['title'] ?? 'Untitled Training',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary900),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Trainer: ${training['trainer'] ?? 'Unknown'}',
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Description
          Text(
            training['description'] ?? '',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: Colors.grey[700], fontSize: 13, height: 1.4),
          ),
          
          const SizedBox(height: 16),
          
          // Date Range
          Row(
            children: [
              Icon(LucideIcons.calendar, size: 14, color: Colors.grey[500]),
              const SizedBox(width: 6),
              Text(
                '${startDate != null ? DateFormat('d/M/yyyy').format(startDate) : 'TBA'} - ${endDate != null ? DateFormat('d/M/yyyy').format(endDate) : 'TBA'}',
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Footer: Year Badge + Actions
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Text('Year: $year', style: TextStyle(fontSize: 12, color: Colors.grey[700], fontWeight: FontWeight.bold)),
              ),
              
              const Spacer(),
              
              TextButton(
                onPressed: () => _showDetails(context, training, startDate, endDate),
                child: const Text('View Details'),
              ),
              
              const SizedBox(width: 8),
              
              ElevatedButton(
                onPressed: isRegistered ? null : () => _handleRegister(context, trainingId, uid),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isRegistered ? Colors.grey[300] : const Color(0xFF5C6BC0), // Matches screenshot purple/blue
                  foregroundColor: isRegistered ? Colors.grey[600] : Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  minimumSize: const Size(0, 36),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: Text(isRegistered ? 'Registered' : 'Register'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _handleRegister(BuildContext context, String trainingId, String uid) async {
    try {
      await FirebaseFirestore.instance.collection('trainings').doc(trainingId).update({
        'participants': FieldValue.arrayUnion([uid])
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Acccessfully Registered!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showDetails(BuildContext context, Map<String, dynamic> training, DateTime? start, DateTime? end) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(24),
          child: ListView(
            controller: controller,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 24),
              Text(training['title'] ?? 'Training', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Trainer: ${training['trainer'] ?? '-'}', style: TextStyle(color: Colors.grey[600], fontSize: 15)),
              const Divider(height: 30),
              Text(training['description'] ?? 'No description.', style: const TextStyle(fontSize: 15, height: 1.5)),
              const SizedBox(height: 20),
              _buildDetailRow('Start Date', start != null ? DateFormat('MMM d, yyyy').format(start) : 'TBA'),
              _buildDetailRow('End Date', end != null ? DateFormat('MMM d, yyyy').format(end) : 'TBA'),
              _buildDetailRow('Eligible Branches', (training['eligibility']?['branches'] as List?)?.join(', ') ?? 'All'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
