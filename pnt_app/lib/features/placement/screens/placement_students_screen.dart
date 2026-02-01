import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class PlacementStudentsScreen extends StatefulWidget {
  const PlacementStudentsScreen({super.key});

  @override
  State<PlacementStudentsScreen> createState() => _PlacementStudentsScreenState();
}

class _PlacementStudentsScreenState extends State<PlacementStudentsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedDepartment = 'All';
  String _selectedStatus = 'All';
  
  final List<String> _departments = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];
  final List<String> _statuses = ['All', 'PLACED', 'UNPLACED'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Database'),
      ),
      body: Column(
        children: [
          // Filters & Search
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.black12)),
            ),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by name or email',
                    prefixIcon: const Icon(LucideIcons.search, size: 20),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  ),
                  onChanged: (v) => setState(() {}),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedDepartment,
                        decoration: const InputDecoration(
                          labelText: 'Department',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                        ),
                        items: _departments.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                        onChanged: (v) => setState(() => _selectedDepartment = v!),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedStatus,
                         decoration: const InputDecoration(
                          labelText: 'Status',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                        ),
                        items: _statuses.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                        onChanged: (v) => setState(() => _selectedStatus = v!),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('users')
                  .where('role', whereIn: ['student', 'STUDENT'])
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
                if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

                var students = snapshot.data!.docs.map((d) => d.data() as Map<String, dynamic>).toList();

                // Client-side filtering
                final query = _searchController.text.toLowerCase();
                students = students.where((s) {
                  final name = (s['displayName'] ?? '').toString().toLowerCase();
                  final email = (s['email'] ?? '').toString().toLowerCase();
                  final dept = (s['department'] ?? '').toString();
                  final status = (s['placementStatus'] ?? 'UNPLACED').toString();

                  final matchesSearch = name.contains(query) || email.contains(query);
                  final matchesDept = _selectedDepartment == 'All' || dept == _selectedDepartment;
                  final matchesStatus = _selectedStatus == 'All' || 
                                        (_selectedStatus == 'PLACED' && status == 'PLACED') ||
                                        (_selectedStatus == 'UNPLACED' && status != 'PLACED');

                  return matchesSearch && matchesDept && matchesStatus;
                }).toList();

                if (students.isEmpty) {
                  return const Center(child: Text('No students found'));
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: students.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final student = students[index];
                    return _StudentCard(student: student, onTap: () => _showStudentDetails(context, student));
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showStudentDetails(BuildContext context, Map<String, dynamic> student) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(padding: const EdgeInsets.all(16), child: const Center(child: Icon(LucideIcons.minus, color: Colors.grey))),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(24),
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            student['displayName'] ?? 'Unknown Name',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                          ),
                        ),
                        if (student['placementStatus'] == 'PLACED')
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: Colors.green[100], borderRadius: BorderRadius.circular(20)),
                            child: const Text('PLACED', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                          )
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(student['email'] ?? '', style: TextStyle(color: Colors.grey[600])),
                    const Divider(height: 32),
                    
                    _detailSection('Academic Details', [
                      _detailRow('Roll No', student['rollNo'] ?? '-'),
                      _detailRow('Department', student['department'] ?? '-'),
                      _detailRow('Section', student['section'] ?? '-'),
                      _detailRow('CGPA', student['cgpa']?.toString() ?? '-'),
                      _detailRow('Standing Arrears', student['standingArreas']?.toString() ?? '0'),
                      _detailRow('History of Arrears', student['historyOfArreas']?.toString() ?? '0'),
                      _detailRow('10th Mark', '${student['tenthMark'] ?? '-'}%'),
                      _detailRow('12th Mark', '${student['twelfthMark'] ?? '-'}%'),
                    ]),
                    
                    const SizedBox(height: 24),
                    _detailSection('Personal Details', [
                      _detailRow('Phone', student['phone'] ?? '-'),
                      _detailRow('Address', student['address'] ?? '-'),
                    ]),
                    
                    const SizedBox(height: 24),
                    // Placeholder for placement records fetch
                    const Text('Placement Records', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.indigo[50], borderRadius: BorderRadius.circular(12)),
                      child: const Row(
                        children: [
                          Icon(LucideIcons.info, size: 16, color: Colors.indigo),
                          SizedBox(width: 8),
                          Text('Fetch records by Roll No logic here', style: TextStyle(color: Colors.indigo)),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 12),
        ...children,
      ],
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _StudentCard extends StatelessWidget {
  final Map<String, dynamic> student;
  final VoidCallback onTap;

  const _StudentCard({required this.student, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: AppTheme.glassDecoration,
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppTheme.primary100,
              child: Text(
                (student['displayName'] ?? 'U').toString().substring(0, 1).toUpperCase(),
                style: const TextStyle(color: AppTheme.primary700, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    student['displayName'] ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    '${student['rollNo'] ?? '-'} • ${student['department'] ?? '-'}',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ],
              ),
            ),
            if (student['placementStatus'] == 'PLACED')
              const Icon(LucideIcons.checkCircle, color: Colors.green, size: 20),
          ],
        ),
      ),
    );
  }
}
