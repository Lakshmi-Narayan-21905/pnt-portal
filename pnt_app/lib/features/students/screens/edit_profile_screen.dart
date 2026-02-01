import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  late TextEditingController _displayNameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _rollNoController;
  late TextEditingController _cgpaController;
  late TextEditingController _standingArrearsController;
  late TextEditingController _historyArrearsController;
  late TextEditingController _tenthController;
  late TextEditingController _twelfthController;
  late TextEditingController _sectionController;
  
  String? _selectedDepartment;
  final List<String> _departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];

  @override
  void initState() {
    super.initState();
    final userProfile = Provider.of<AuthService>(context, listen: false).userProfile!;
    _displayNameController = TextEditingController(text: userProfile['displayName']);
    _phoneController = TextEditingController(text: userProfile['phone']);
    _addressController = TextEditingController(text: userProfile['address']);
    _rollNoController = TextEditingController(text: userProfile['rollNo']);
    _cgpaController = TextEditingController(text: userProfile['cgpa']?.toString());
    _standingArrearsController = TextEditingController(text: userProfile['standingArreas']?.toString());
    _historyArrearsController = TextEditingController(text: userProfile['historyOfArreas']?.toString());
    _tenthController = TextEditingController(text: userProfile['tenthMark']?.toString());
    _twelfthController = TextEditingController(text: userProfile['twelfthMark']?.toString());
    _sectionController = TextEditingController(text: userProfile['section']);
    _selectedDepartment = userProfile['department'];
    if (!_departments.contains(_selectedDepartment)) _selectedDepartment = null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    try {
      final uid = Provider.of<AuthService>(context, listen: false).user!.uid;
      final updates = {
        'displayName': _displayNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'address': _addressController.text.trim(),
        'rollNo': _rollNoController.text.trim(),
        'department': _selectedDepartment,
        'section': _sectionController.text.trim(),
        'cgpa': double.tryParse(_cgpaController.text.trim()) ?? 0.0,
        'standingArreas': int.tryParse(_standingArrearsController.text.trim()) ?? 0,
        'historyOfArreas': int.tryParse(_historyArrearsController.text.trim()) ?? 0,
        'tenthMark': double.tryParse(_tenthController.text.trim()) ?? 0.0,
        'twelfthMark': double.tryParse(_twelfthController.text.trim()) ?? 0.0,
        'profileStatus': 'PENDING', // Reset verification on edit
      };

      String collection = 'students'; // Default to students since this is student feature
      final role = Provider.of<AuthService>(context, listen: false).userRole;
      
      if (role == 'admin') collection = 'admin';
      else if (role == 'placement_head') collection = 'placement_heads'; // Verify if matches AuthService
      else if (role == 'training_head') collection = 'training_heads';
      else if (role == 'dept_coordinator') collection = 'dept_coordinators';
      else if (role == 'class_coordinator') collection = 'class_coordinators';
      
      // The user reported "students" collection usage for their profile.
      // We will try to update the collection that corresponds to their role.
      
      await FirebaseFirestore.instance.collection(collection).doc(uid).update(updates);
      
      // Force refresh profile in AuthService (optional, but good practice)
      // For now, AuthService listens to realtime updates if I implemented it that way, 
      // but the current implementation fetches only on auth state change.
      // So let's manually trigger a fetch or just pop.
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully')));
        context.pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildSectionHeader('Personal Info'),
            TextFormField(controller: _displayNameController, decoration: const InputDecoration(labelText: 'Full Name')),
            const SizedBox(height: 12),
            TextFormField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: 12),
            TextFormField(controller: _addressController, decoration: const InputDecoration(labelText: 'Address')),
            const SizedBox(height: 12),
            TextFormField(controller: _rollNoController, decoration: const InputDecoration(labelText: 'Roll Number')),
            
            const SizedBox(height: 24),
            _buildSectionHeader('Academic Info'),
            DropdownButtonFormField<String>(
              value: _selectedDepartment,
              decoration: const InputDecoration(labelText: 'Department'),
              items: _departments.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
              onChanged: (v) => setState(() => _selectedDepartment = v),
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _sectionController, decoration: const InputDecoration(labelText: 'Section')),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _cgpaController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'CGPA'))),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _standingArrearsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Standing Arrears'))),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _historyArrearsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'History of Arrears')),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _tenthController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '10th Mark %'))),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _twelfthController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '12th Mark %'))),
              ],
            ),

            const SizedBox(height: 32),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _save,
                child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary700)),
        const Divider(),
        const SizedBox(height: 8),
      ],
    );
  }
}
