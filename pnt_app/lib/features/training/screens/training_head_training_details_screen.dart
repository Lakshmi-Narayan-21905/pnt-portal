import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class TrainingHeadTrainingDetailsScreen extends StatefulWidget {
  final String trainingId;
  final Map<String, dynamic> training;

  const TrainingHeadTrainingDetailsScreen({
    super.key, 
    required this.trainingId,
    required this.training,
  });

  @override
  State<TrainingHeadTrainingDetailsScreen> createState() => _TrainingHeadTrainingDetailsScreenState();
}

class _TrainingHeadTrainingDetailsScreenState extends State<TrainingHeadTrainingDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Student List Filters
  String _deptFilter = 'All';
  String? _statusFilter = 'All';
  final List<String> _departments = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.training['title'] ?? 'Training Details'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Details'),
            Tab(text: 'Students'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDetailsTab(),
          _buildStudentsTab(),
        ],
      ),
    );
  }

  Widget _buildDetailsTab() {
    final training = widget.training;
    
    // Dates
    DateTime? date;
    if (training['date'] is Timestamp) date = (training['date'] as Timestamp).toDate();
    
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(training['title'] ?? 'Untitled Training', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primary900)),
              const SizedBox(height: 8),
              Text('Trainer: ${training['trainer'] ?? 'Unknown'}', 
                style: TextStyle(fontSize: 16, color: Colors.grey[700], fontWeight: FontWeight.w500)),
                
              const Divider(height: 30),
              
              // Grid Stats
              Wrap(
                spacing: 20,
                runSpacing: 20,
                children: [
                  _buildStatItem('Date', date != null ? DateFormat('d/M/yyyy').format(date) : 'TBA'),
                  _buildStatItem('Time', training['time'] ?? 'TBA'),
                  _buildStatItem('Venue', training['venue'] ?? 'TBA'),
                  _buildStatItem('Duration', training['duration'] ?? 'N/A'),
                ],
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 24),
        
        _buildSectionTitle('Description'),
        Text(training['description'] ?? 'No description provided.', style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87)),
        
        const SizedBox(height: 24),

        // Topics (if available in schema, assumed based on typical training data)
        if (training['topics'] != null) ...[
           _buildSectionTitle('Topics Covered'),
           Wrap(
             spacing: 8,
             children: (training['topics'] as List).map((t) => Chip(
               label: Text(t.toString()),
               backgroundColor: Colors.purple.withOpacity(0.05),
               labelStyle: const TextStyle(color: Colors.purple),
               side: BorderSide.none,
             )).toList(),
           )
        ]
      ],
    );
  }

  Widget _buildStudentsTab() {
    // List of registered student UIDs
    final registeredStudentIds = List<String>.from(widget.training['participants'] ?? []);

    return Column(
      children: [
        // Filters
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, border: Border(bottom: BorderSide(color: Colors.grey[200]!))),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterDropdown('Department', _departments, _deptFilter, (v) => setState(() => _deptFilter = v!)),
                const SizedBox(width: 12),
                _buildFilterDropdown('Status', ['All', 'Applied', 'Not Applied'], _statusFilter ?? 'All', (v) => setState(() => _statusFilter = v)),
              ],
            ),
          ),
        ),

        // List
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance.collection('students').snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
              if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

              var students = snapshot.data!.docs.map((d) => d.data() as Map<String, dynamic>).toList();

              // Filter students
              students = students.where((s) {
                 final isRegistered = registeredStudentIds.contains(s['uid']);
                 
                 // Department Filter
                 if (_deptFilter != 'All' && s['department'] != _deptFilter) return false;
                 
                 // Status Filter
                 if (_statusFilter == 'Applied' && !isRegistered) return false;
                 if (_statusFilter == 'Not Applied' && isRegistered) return false;
                 
                 return true;
              }).toList();

              if (students.isEmpty) return const Center(child: Text('No students found matching criteria.'));

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: students.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final student = students[index];
                  final isRegistered = registeredStudentIds.contains(student['uid']);
                  
                  return Container(
                     decoration: AppTheme.glassDecoration,
                     child: ListTile(
                       title: Text(student['displayName'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                       subtitle: Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                           Text('${student['department'] ?? ''} • ${student['rollNo'] ?? ''}'),
                           Text(student['email'] ?? '', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                         ],
                       ),
                       trailing: Container(
                         padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                         decoration: BoxDecoration(
                           color: isRegistered ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1), 
                           borderRadius: BorderRadius.circular(20),
                           border: Border.all(color: isRegistered ? Colors.green.withOpacity(0.3) : Colors.orange.withOpacity(0.3))
                         ),
                         child: Text(
                           isRegistered ? 'Applied' : 'Not Applied', 
                           style: TextStyle(
                             color: isRegistered ? Colors.green : Colors.orange, 
                             fontSize: 12, 
                             fontWeight: FontWeight.bold
                           )
                         ),
                       ),
                     ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary900)),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return SizedBox(
      width: 150, // Fixed width for grid alignment
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildFilterDropdown(String label, List<String> items, String value, Function(String?) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Container(
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: onChanged,
              icon: const Icon(LucideIcons.chevronDown, size: 16),
            ),
          ),
        ),
      ],
    );
  }
}
