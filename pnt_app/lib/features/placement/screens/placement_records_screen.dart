import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/theme/app_theme.dart';

class PlacementRecordsScreen extends StatelessWidget {
  const PlacementRecordsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Placement Records')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('students') // Looking for students who are placed
            .where('placementStatus', isEqualTo: 'PLACED')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

          final students = snapshot.data!.docs;
          if (students.isEmpty) return const Center(child: Text('No placement records found.'));

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final student = students[index].data() as Map<String, dynamic>;
              return Container(
                decoration: AppTheme.glassDecoration,
                child: ListTile(
                  title: Text(student['displayName'] ?? 'Unknown Student', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${student['department'] ?? ''} • Placed in ${student['company'] ?? 'Unknown Company'}'), // Assuming 'company' field exists or needs logic
                  trailing: Text('${student['package'] ?? 'N/A'} LPA', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
