import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class PlacementHeadDriveDetailsScreen extends StatefulWidget {
  final String companyId;
  final Map<String, dynamic> drive;

  const PlacementHeadDriveDetailsScreen({
    super.key, 
    required this.companyId,
    required this.drive,
  });

  @override
  State<PlacementHeadDriveDetailsScreen> createState() => _PlacementHeadDriveDetailsScreenState();
}

class _PlacementHeadDriveDetailsScreenState extends State<PlacementHeadDriveDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Student List Filters
  String _eligibilityFilter = 'All'; // All, Eligible Only
  String _statusFilter = 'All'; // All, Applied, Opted Out, Not Registered
  String _deptFilter = 'All';
  
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
        title: Text(widget.drive['name'] ?? 'Drive Details'),
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
    final drive = widget.drive;
    final eligibility = drive['eligibilityCriteria'] as Map<String, dynamic>? ?? {};
    
    // Dates
    DateTime? driveDate;
    if (drive['driveDate'] is int) driveDate = DateTime.fromMillisecondsSinceEpoch(drive['driveDate']);
    DateTime? deadline;
    if (drive['deadline'] is int) deadline = DateTime.fromMillisecondsSinceEpoch(drive['deadline']);

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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(drive['name'] ?? 'Unknown', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primary900)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                    child: const Text('Open', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('${drive['type'] ?? 'Company'} • ${((drive['roles'] as List?) ?? []).join(', ')}', 
                style: TextStyle(fontSize: 15, color: Colors.grey[700])),
                
              const Divider(height: 30),
              
              // Grid Stats
              Wrap(
                spacing: 20,
                runSpacing: 20,
                children: [
                  _buildStatItem('Package', '${drive['salary'] ?? 'N/A'} LPA'),
                  _buildStatItem('Drive Date', driveDate != null ? DateFormat('d/M/yyyy').format(driveDate) : 'TBA'),
                  _buildStatItem('Deadline', deadline != null ? DateFormat('d/M/yyyy').format(deadline) : 'TBA'),
                  _buildStatItem('Target Batch', '${drive['batch'] ?? '2026'}'),
                  _buildStatItem('Min CGPA', '${eligibility['minCGPA'] ?? 'N/A'}'),
                ],
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 24),
        
        _buildSectionTitle('Description'),
        Text(drive['description'] ?? 'No description', style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87)),
        
        const SizedBox(height: 24),
        
        // Eligibility
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[300]!)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('Eligibility Criteria'),
              const SizedBox(height: 12),
              _buildEligRow('10th Mark', '${eligibility['sslc'] ?? '-'}%'),
              _buildEligRow('12th Mark', '${eligibility['hsc'] ?? '-'}%'),
              _buildEligRow('Standing Arrears', '${eligibility['standingArrears'] ?? 0}'),
              _buildEligRow('History of Arrears', '${eligibility['historyOfArrears'] ?? '-'}'),
              const SizedBox(height: 12),
              const Text('Eligible Branches', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: (eligibility['branches'] as List? ?? []).map((b) => Chip(
                  label: Text(b.toString()),
                  backgroundColor: Colors.white,
                  labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  side: BorderSide(color: Colors.grey[300]!),
                )).toList(),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),
        
        // Rounds
        if (drive['rounds'] != null) ...[
          _buildSectionTitle('Rounds'),
          ...((drive['rounds'] as List).asMap().entries.map((e) => ListTile(
            leading: CircleAvatar(backgroundColor: AppTheme.primary100, child: Text('${e.key + 1}', style: const TextStyle(color: AppTheme.primary700))),
            title: Text(e.value.toString()),
            dense: true,
            contentPadding: EdgeInsets.zero,
          ))),
          const SizedBox(height: 24),
        ],

        // Requirements
        if (drive['requirements'] != null) ...[
           _buildSectionTitle('Requirements'),
           Wrap(
             spacing: 8,
             children: (drive['requirements'] as List).map((r) => Chip(
               label: Text(r.toString()),
               backgroundColor: Colors.blue.withOpacity(0.05),
               labelStyle: const TextStyle(color: Colors.blue),
               side: BorderSide.none,
             )).toList(),
           )
        ]
      ],
    );
  }

  Widget _buildStudentsTab() {
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
                _buildFilterDropdown('Status', ['All', 'Applied', 'Opted Out', 'Not Registered'], _statusFilter, (v) => setState(() => _statusFilter = v!)),
                const SizedBox(width: 12),
                _buildFilterDropdown('Eligibility', ['All', 'Eligible Only'], _eligibilityFilter, (v) => setState(() => _eligibilityFilter = v!)),
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

              // Apply Filters
              students = students.where((s) {
                 // 1. Dept Filter
                 if (_deptFilter != 'All' && s['department'] != _deptFilter) return false;
                 
                 // 2. Status Filter
                 final applicants = List<String>.from(widget.drive['applicants'] ?? []);
                 final optedOut = List<String>.from(widget.drive['optedOut'] ?? []);
                 final uid = s['uid'];
                 
                 String status = 'Not Registered';
                 if (applicants.contains(uid)) status = 'Applied';
                 else if (optedOut.contains(uid)) status = 'Opted Out';
                 
                 if (_statusFilter != 'All' && _statusFilter != status) return false;

                 // 3. Eligibility Filter (Basic check for now)
                 if (_eligibilityFilter == 'Eligible Only') {
                    // Reuse eligibility logic if possible, or just skip complexity for now as logic is in another file
                    // Ideally we should import _checkEligibility from a shared util
                 }
                 
                 return true;
              }).toList();

              if (students.isEmpty) return const Center(child: Text('No students found matching criteria.'));

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: students.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final student = students[index];
                  final applicants = List<String>.from(widget.drive['applicants'] ?? []);
                  final optedOut = List<String>.from(widget.drive['optedOut'] ?? []);
                  
                  String status = 'Not Registered';
                  Color statusColor = Colors.grey;
                  if (applicants.contains(student['uid'])) {
                    status = 'Applied';
                    statusColor = Colors.green;
                  } else if (optedOut.contains(student['uid'])) {
                    status = 'Opted Out';
                    statusColor = Colors.red;
                  }

                  return Container(
                     decoration: AppTheme.glassDecoration,
                     child: ListTile(
                       title: Text(student['displayName'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                       subtitle: Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                           Text('${student['department'] ?? ''} • CGPA: ${student['cgpa'] ?? '-'}'),
                           Text(student['email'] ?? '', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                         ],
                       ),
                       trailing: Container(
                         padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                         decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                         child: Text(status, style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold)),
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

  Widget _buildEligRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
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
