import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class AddTrainingScreen extends StatefulWidget {
  const AddTrainingScreen({super.key});

  @override
  State<AddTrainingScreen> createState() => _AddTrainingScreenState();
}

class _AddTrainingScreenState extends State<AddTrainingScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _trainerController = TextEditingController();
  
  DateTime? _startDate;
  DateTime? _endDate;
  int _selectedYear = 1;
  
  final List<String> _departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];
  final List<String> _selectedDepartments = [];

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select valid dates')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final data = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'trainer': _trainerController.text.trim(),
        'eligibility': {
          'branches': _selectedDepartments,
          'year': _selectedYear,
        },
        'startDate': _startDate!.millisecondsSinceEpoch,
        'endDate': _endDate!.millisecondsSinceEpoch,
        'participants': [],
        'createdAt': FieldValue.serverTimestamp(),
      };

      await FirebaseFirestore.instance.collection('trainings').add(data);
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
      appBar: AppBar(title: const Text('Add Training Program')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Training Title', prefixIcon: Icon(LucideIcons.graduationCap)),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _trainerController,
              decoration: const InputDecoration(labelText: 'Trainer / Organization', prefixIcon: Icon(LucideIcons.user)),
               validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            
            const SizedBox(height: 24),
            const Text('Eligibility', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            
            DropdownButtonFormField<int>(
              value: _selectedYear,
              decoration: const InputDecoration(labelText: 'Target Year', prefixIcon: Icon(LucideIcons.calendar)),
              items: [1, 2, 3, 4].map((y) => DropdownMenuItem(value: y, child: Text('Year $y'))).toList(),
              onChanged: (v) => setState(() => _selectedYear = v!),
            ),
            const SizedBox(height: 12),
            Text('Target Branches', style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.bold)),
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
            const Text('Schedule', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ListTile(
              title: Text(_startDate == null ? 'Select Start Date' : 'Starts: ${_startDate!.toString().split(' ')[0]}'),
              trailing: const Icon(LucideIcons.calendar),
              onTap: () => _selectDate(context, true),
            ),
            ListTile(
              title: Text(_endDate == null ? 'Select End Date' : 'Ends: ${_endDate!.toString().split(' ')[0]}'),
              trailing: const Icon(LucideIcons.clock),
              onTap: () => _selectDate(context, false),
            ),

            const SizedBox(height: 24),
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Description'),
            ),

            const SizedBox(height: 32),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Training'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
