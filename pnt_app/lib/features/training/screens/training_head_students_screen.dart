import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/theme/app_theme.dart';

class TrainingHeadStudentsScreen extends StatefulWidget {
  const TrainingHeadStudentsScreen({super.key});

  @override
  State<TrainingHeadStudentsScreen> createState() => _TrainingHeadStudentsScreenState();
}

class _TrainingHeadStudentsScreenState extends State<TrainingHeadStudentsScreen> {
  String? _selectedDept;
  String? _selectedStatus;
  final List<String> _depts = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];
  final List<String> _statuses = ['All', 'PLACED', 'UNPLACED', 'OFFERED'];

  @override
  Widget build(BuildContext context) {
    Query query = FirebaseFirestore.instance.collection('students');
    
    if (_selectedDept != null && _selectedDept != 'All') {
      query = query.where('department', isEqualTo: _selectedDept);
    }
    if (_selectedStatus != null && _selectedStatus != 'All') {
      query = query.where('placementStatus', isEqualTo: _selectedStatus);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Students')),
      body: Column(
        children: [
          // Filters
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildDropdown('Dept', _depts, _selectedDept, (v) => setState(() => _selectedDept = v)),
                  const SizedBox(width: 8),
                  _buildDropdown('Placement Status', _statuses, _selectedStatus, (v) => setState(() => _selectedStatus = v)),
                ],
              ),
            ),
          ),
          
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: query.snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
                if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

                var students = snapshot.data!.docs.map((d) => d.data() as Map<String, dynamic>).toList();

                if (students.isEmpty) return const Center(child: Text('No students found matching criteria.'));

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: students.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final student = students[index];
                    return Container(
                      decoration: AppTheme.glassDecoration,
                      child: ListTile(
                        leading: CircleAvatar(child: Text((student['displayName'] ?? 'U')[0])),
                        title: Text(student['displayName'] ?? 'Unknown'),
                        subtitle: Text('${student['rollNo'] ?? ''} • ${student['department'] ?? ''}'),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown(String label, List<String> items, String? value, Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          hint: Text(label),
          value: value,
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
