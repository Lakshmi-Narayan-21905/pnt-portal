import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class StudentProfileScreen extends StatelessWidget {
  const StudentProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userProfile = Provider.of<AuthService>(context).userProfile;

    if (userProfile == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.edit),
            onPressed: () => context.push('/student/profile/edit'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Personal Details
            _buildSection(
              title: 'Personal Details',
              children: [
                _buildRow('Full Name', userProfile['displayName'] ?? '-'),
                _buildRow('Email', userProfile['email'] ?? '-'),
                _buildRow('Roll Number', (userProfile['rollNo'] ?? '-').toString().toUpperCase()),
                _buildRow('Phone', userProfile['phone'] ?? '-'),
                _buildRow('Address', userProfile['address'] ?? '-'),
              ],
            ),
            const SizedBox(height: 24),
            
            // Academic Details
            _buildSection(
              title: 'Academic Details',
              children: [
                _buildRow('Department', userProfile['department'] ?? '-'),
                if (userProfile['section'] != null)
                  _buildRow('Section', userProfile['section'] ?? '-'),
                _buildRow('CGPA', userProfile['cgpa']?.toString() ?? '-'),
                _buildRow('Standing Arrears', userProfile['standingArreas']?.toString() ?? '0', isError: (int.tryParse(userProfile['standingArreas']?.toString() ?? '0') ?? 0) > 0),
                _buildRow('History of Arrears', userProfile['historyOfArreas']?.toString() ?? '0'),
                _buildRow('10th Mark', '${userProfile['tenthMark'] ?? '-'}%'),
                _buildRow('12th Mark', '${userProfile['twelfthMark'] ?? '-'}%'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required List<Widget> children}) {
    return Container(
      decoration: AppTheme.glassDecoration,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.indigo)),
          const Divider(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isError = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w500)),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: isError ? Colors.red : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
