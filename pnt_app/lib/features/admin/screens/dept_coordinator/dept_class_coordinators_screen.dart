import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../core/theme/app_theme.dart';

class DeptClassCoordinatorsScreen extends StatelessWidget {
  final String department;

  const DeptClassCoordinatorsScreen({super.key, required this.department});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('$department Class Coordinators')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('class_coordinators')
            .where('department', isEqualTo: department)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

          final coords = snapshot.data!.docs;
          if (coords.isEmpty) return const Center(child: Text('No class coordinators found for this department.'));

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: coords.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final coord = coords[index].data() as Map<String, dynamic>;
              return Container(
                decoration: AppTheme.glassDecoration,
                child: ListTile(
                  leading: CircleAvatar(child: Text((coord['displayName'] ?? 'U')[0])),
                  title: Text(coord['displayName'] ?? 'Unknown'),
                  subtitle: Text(coord['email'] ?? ''),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
