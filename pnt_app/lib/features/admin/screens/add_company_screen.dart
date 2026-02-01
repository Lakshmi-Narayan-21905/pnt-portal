import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class AddCompanyScreen extends StatefulWidget {
  const AddCompanyScreen({super.key});

  @override
  State<AddCompanyScreen> createState() => _AddCompanyScreenState();
}

class _AddCompanyScreenState extends State<AddCompanyScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Form Fields
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _roleController = TextEditingController();
  final _typeController = TextEditingController();
  final _salaryController = TextEditingController(); // Store as string "10 LPA" or just number "10"
  final _targetYearController = TextEditingController(text: DateTime.now().year.toString());
  final _minCGPAController = TextEditingController();
  final _backlogsController = TextEditingController(text: '0');
  
  DateTime? _driveDate;
  DateTime? _deadlineDate;
  
  // Lists
  final List<String> _departments = [
    'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS'
  ];
  final List<String> _selectedDepartments = [];

  Future<void> _selectDate(BuildContext context, bool isDriveDate) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isDriveDate) {
          _driveDate = picked;
        } else {
          _deadlineDate = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_driveDate == null || _deadlineDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select valid dates')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final data = {
        'name': _nameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'roles': [_roleController.text.trim()], // Array for consistency
        'type': _typeController.text.trim(),
        'salary': '${_salaryController.text.trim()} LPA',
        'targetYear': int.tryParse(_targetYearController.text) ?? DateTime.now().year,
        'eligibilityCriteria': {
          'minCGPA': double.tryParse(_minCGPAController.text) ?? 0.0,
          'backlogsAllowed': int.tryParse(_backlogsController.text) ?? 0,
          'branches': _selectedDepartments,
        },
        'driveDate': _driveDate!.millisecondsSinceEpoch, // Store as timestamp/long
        'deadline': _deadlineDate!.millisecondsSinceEpoch,
        'createdAt': FieldValue.serverTimestamp(),
        'applicants': [],
      };

      await FirebaseFirestore.instance.collection('companies').add(data);
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Company Drive')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildSectionHeader('Basic Info'),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Company Name', prefixIcon: Icon(LucideIcons.building)),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _roleController,
              decoration: const InputDecoration(labelText: 'Job Role (e.g. SDE)', prefixIcon: Icon(LucideIcons.briefcase)),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
             TextFormField(
              controller: _typeController, // Could be dropdown
              decoration: const InputDecoration(labelText: 'Type (e.g. Product, Service)', prefixIcon: Icon(LucideIcons.tag)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _salaryController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Package (LPA)', prefixIcon: Icon(LucideIcons.indianRupee)),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            
            const SizedBox(height: 24),
            _buildSectionHeader('Eligibility'),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _minCGPAController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Min CGPA'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _backlogsController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Max Backlogs'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text('Eligible Branches', style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.bold)),
            Wrap(
              spacing: 8,
              children: _departments.map((dept) {
                final isSelected = _selectedDepartments.contains(dept);
                return FilterChip(
                  label: Text(dept),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedDepartments.add(dept);
                      } else {
                        _selectedDepartments.remove(dept);
                      }
                    });
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 24),
            _buildSectionHeader('Schedule'),
            ListTile(
              title: Text(_driveDate == null ? 'Select Drive Date' : 'Drive Date: ${_driveDate!.toString().split(' ')[0]}'),
              trailing: const Icon(LucideIcons.calendar),
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade300)),
              onTap: () => _selectDate(context, true),
            ),
            const SizedBox(height: 12),
            ListTile(
              title: Text(_deadlineDate == null ? 'Select Deadline' : 'Deadline: ${_deadlineDate!.toString().split(' ')[0]}'),
              trailing: const Icon(LucideIcons.clock),
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade300)),
              onTap: () => _selectDate(context, false),
            ),

            const SizedBox(height: 24),
            _buildSectionHeader('Aditional Info'),
            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description / Remarks'),
            ),

            const SizedBox(height: 32),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Drive'),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primary800),
      ),
    );
  }
}
