import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';

class ClassStudentsScreen extends StatefulWidget {
  final String department;
  final String section;

  const ClassStudentsScreen({
    super.key, 
    required this.department, 
    required this.section
  });

  @override
  State<ClassStudentsScreen> createState() => _ClassStudentsScreenState();
}

class _ClassStudentsScreenState extends State<ClassStudentsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Students', style: TextStyle(fontWeight: FontWeight.bold)),
            Text('${widget.department} - ${widget.section}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Row(
              children: [
                _buildActionButton('Upload Excel', LucideIcons.upload, Colors.green, () {
                  // TODO: Implement Excel Upload
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Excel Upload Coming Soon')));
                }),
                const SizedBox(width: 8),
                _buildActionButton('Add Student', LucideIcons.plus, Colors.purple, () {
                  // TODO: Navigate to Add Student Screen
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add Student Coming Soon')));
                }),
              ],
            ),
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('students')
            .where('department', isEqualTo: widget.department)
            .where('section', isEqualTo: widget.section)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

          final students = snapshot.data!.docs;
          if (students.isEmpty) return const Center(child: Text('No students found in this class.'));

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final studentDoc = students[index];
              final student = studentDoc.data() as Map<String, dynamic>;
              return _buildStudentRow(context, studentDoc.id, student);
            },
          );
        },
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onPressed) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 16),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Widget _buildStudentRow(BuildContext context, String uid, Map<String, dynamic> student) {
    String status = student['profileStatus'] ?? 'Pending';
    Color statusColor = status == 'Verified' ? Colors.green : Colors.orange;
    if (status == 'Approved') { status = 'Verified'; statusColor = Colors.green; }

    return InkWell(
      onTap: () => _showStudentDetails(context, uid, student),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.transparent),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: AppTheme.primary100,
              child: Text((student['displayName'] ?? 'U')[0], style: const TextStyle(color: AppTheme.primary700)),
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
                  const SizedBox(height: 4),
                  Row(
                     children: [
                       Text(student['rollNo'] ?? 'No Roll No', style: TextStyle(color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w500)),
                       const SizedBox(width: 8),
                       const Text('•', style: TextStyle(color: Colors.grey)),
                       const SizedBox(width: 8),
                       Expanded(
                         child: Text(
                           student['email'] ?? '-',
                           style: TextStyle(color: Colors.grey[500], fontSize: 13),
                           overflow: TextOverflow.ellipsis,
                         ),
                       ),
                     ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showStudentDetails(BuildContext context, String uid, Map<String, dynamic> student) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          width: 500, // Fixed width for dialog on larger screens
          constraints: const BoxConstraints(maxWidth: 600, maxHeight: 800),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Student Details', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    IconButton(icon: const Icon(LucideIcons.x), onPressed: () => Navigator.pop(context)),
                  ],
                ),
              ),
              const Divider(height: 1),
              
              // Content
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status & Date
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                           Column(
                             crossAxisAlignment: CrossAxisAlignment.start,
                             children: [
                               const Text('STATUS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                               const SizedBox(height: 4),
                               Container(
                                 padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                 decoration: BoxDecoration(
                                   color: (student['profileStatus'] == 'Verified' ? Colors.green : Colors.orange).withOpacity(0.1),
                                   borderRadius: BorderRadius.circular(4),
                                 ),
                                 child: Text(student['profileStatus'] ?? 'Pending', 
                                   style: TextStyle(color: student['profileStatus'] == 'Verified' ? Colors.green : Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
                               ),
                             ],
                           ),
                           // Created At (assuming logic, or omit if not available)
                        ],
                      ),
                      const SizedBox(height: 32),
                      
                      const Text('Personal Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildDetailField('Roll No', student['rollNo'])),
                          Expanded(child: _buildDetailField('Name', student['displayName'])),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildDetailField('Email', student['email'])),
                          Expanded(child: _buildDetailField('Phone', student['phone'])),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildDetailField('Address', student['address']),
                      
                      const SizedBox(height: 32),
                      const Text('Academic Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                       Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildDetailField('Department', student['department'])),
                          Expanded(child: _buildDetailField('Section', student['section'])),
                          Expanded(child: _buildDetailField('CGPA', student['cgpa']?.toString())),
                        ],
                      ),
                       const SizedBox(height: 16),
                       Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildDetailField('10th Mark', '${student['tenthMark'] ?? '-'}%')),
                          Expanded(child: _buildDetailField('12th Mark', '${student['twelfthMark'] ?? '-'}%')),
                          Expanded(child: _buildDetailField('Standing Arrears', '${student['standingArreas'] ?? '0'}')),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildDetailField('History of Arrears', '${student['historyOfArreas'] ?? '0'}'),
                    ],
                  ),
                ),
              ),
              
              const Divider(height: 1),
              
              // Actions
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _updateStatus(context, uid, 'Rejected'), // Or 'Declined'
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Decline'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _updateStatus(context, uid, 'Verified'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Approve'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailField(String label, String? value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        const SizedBox(height: 4),
        Text(value ?? '-', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      ],
    );
  }

  Future<void> _updateStatus(BuildContext context, String uid, String status) async {
    try {
      await FirebaseFirestore.instance.collection('students').doc(uid).update({
        'profileStatus': status,
      });
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Student status updated to $status')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }
}
