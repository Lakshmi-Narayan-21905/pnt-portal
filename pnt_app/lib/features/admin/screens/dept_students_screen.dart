import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class DeptStudentsScreen extends StatefulWidget {
  const DeptStudentsScreen({super.key});

  @override
  State<DeptStudentsScreen> createState() => _DeptStudentsScreenState();
}

class _DeptStudentsScreenState extends State<DeptStudentsScreen> {
  final TextEditingController _searchController = TextEditingController();
  
  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final myDept = authService.userProfile?['department'];

    if (myDept == null) {
      return const Scaffold(body: Center(child: Text('No department assigned to your profile.')));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('$myDept Students'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name or email',
                prefixIcon: const Icon(LucideIcons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => setState(() {}),
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('users')
                  .where('role', whereIn: ['student', 'STUDENT'])
                  .where('department', isEqualTo: myDept)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
                if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

                var students = snapshot.data!.docs.map((d) => d.data() as Map<String, dynamic>).toList();

                final query = _searchController.text.toLowerCase();
                if (query.isNotEmpty) {
                  students = students.where((s) {
                    final name = (s['displayName'] ?? '').toString().toLowerCase();
                    final email = (s['email'] ?? '').toString().toLowerCase();
                    return name.contains(query) || email.contains(query);
                  }).toList();
                }

                if (students.isEmpty) return const Center(child: Text('No students found.'));

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: students.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final student = students[index];
                    return Container(
                      decoration: AppTheme.glassDecoration,
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          CircleAvatar(
                            child: Text((student['displayName'] ?? 'U').toString()[0].toUpperCase()),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(student['displayName'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                                Text(student['email'] ?? '', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                                Text('Roll No: ${student['rollNo'] ?? '-'}', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                              ],
                            ),
                          ),
                          // TODO: Add Verify Button logic here
                           if (student['profileStatus'] == 'APPROVAL_PENDING')
                            ElevatedButton(
                              onPressed: () => _verifyStudent(context, snapshot.data!.docs[index].id),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, padding: const EdgeInsets.symmetric(horizontal: 12)),
                              child: const Text('Verify', style: TextStyle(fontSize: 12)),
                            )
                        ],
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

  Future<void> _verifyStudent(BuildContext context, String uid) async {
      await FirebaseFirestore.instance.collection('users').doc(uid).update({
        'profileStatus': 'VERIFIED'
      });
      if(mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Verified!')));
  }
}
