import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';

class CompanyDrivesScreen extends StatelessWidget {
  const CompanyDrivesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userProfile = Provider.of<AuthService>(context).userProfile;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Drives & Opportunities'),
      ),
      body: userProfile == null
          ? const Center(child: CircularProgressIndicator())
          : StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance.collection('companies').snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final drives = snapshot.data!.docs;

                if (drives.isEmpty) {
                  return const Center(child: Text('No active drives found.'));
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: drives.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final driveDoc = drives[index];
                    final drive = driveDoc.data() as Map<String, dynamic>;
                    return _buildCompanyCard(context, driveDoc.id, drive, userProfile);
                  },
                );
              },
            ),
    );
  }

  Widget _buildCompanyCard(
      BuildContext context, String companyId, Map<String, dynamic> drive, Map<String, dynamic> userProfile) {
    // Parse Dates
    DateTime? driveDate;
    if (drive['driveDate'] is int) {
      driveDate = DateTime.fromMillisecondsSinceEpoch(drive['driveDate']);
    }

    DateTime? deadline;
    if (drive['deadline'] is int) {
      deadline = DateTime.fromMillisecondsSinceEpoch(drive['deadline']);
    }

    // Eligibility Check
    final eligibilityResult = _checkEligibility(drive, userProfile);
    final isEligible = eligibilityResult['isEligible'] as bool;
    final ineligibleReason = eligibilityResult['reason'] as String?;

    // Status Check
    final List applicants = drive['applicants'] ?? [];
    final List optedOut = drive['optedOut'] ?? [];
    final String uid = userProfile['uid'];

    final bool hasApplied = applicants.contains(uid);
    final bool hasOptedOut = optedOut.contains(uid);

    // Format fields
    final String salary = drive['salary']?.toString() ?? 'N/A';
    final String type = drive['type'] ?? 'Company';
    final List roles = drive['roles'] ?? [];
    final String roleText = roles.isNotEmpty ? roles.join(', ') : 'Open Role';

    return Container(
      decoration: AppTheme.glassDecoration,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Name and Salary Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      drive['name'] ?? 'Unknown Company',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$type • $roleText',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: Text(
                  '$salary LPA',
                  style: const TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Description snippet
          Text(
            drive['description'] ?? '',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: Colors.grey[700], fontSize: 13),
          ),
          
          const SizedBox(height: 16),
          
          // Info Grid
          Row(
            children: [
              if (driveDate != null)
                _buildMiniInfo(LucideIcons.calendar, 'Drive: ${DateFormat('d/M/yyyy').format(driveDate)}'),
              const Spacer(),
              if (deadline != null)
                 _buildMiniInfo(LucideIcons.clock, 'Deadline: ${DateFormat('d/M/yyyy').format(deadline)}'),
            ],
          ),
          
          const Divider(height: 24),
          
          // Actions
          if (!isEligible)
            Row(
              children: [
                const Icon(LucideIcons.alertCircle, color: Colors.red, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Not Eligible (${ineligibleReason ?? 'Criteria not met'})',
                    style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _showDriveDetails(context, drive, driveDate),
                  icon: const Icon(LucideIcons.info, size: 16),
                  label: const Text('View Details'),
                ),
              ],
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                     // Opt In Button
                     if (!hasApplied && !hasOptedOut)
                      ElevatedButton(
                        onPressed: () => _handleAction(context, companyId, 'opt-in', uid),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          minimumSize: const Size(0, 36),
                        ),
                        child: const Text('Opt In'),
                      ),
                    
                    if (hasApplied)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                        child: const Text('Applied', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                      ),

                    if (!hasApplied && !hasOptedOut)
                       const SizedBox(width: 8),

                    // Opt Out Button
                    if (!hasOptedOut && !hasApplied)
                      ElevatedButton(
                        onPressed: () => _handleAction(context, companyId, 'opt-out', uid),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          minimumSize: const Size(0, 36),
                        ),
                        child: const Text('Opt Out'),
                      ),
                      
                    if (hasOptedOut)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                        child: const Text('Opted Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
              
                TextButton.icon(
                  onPressed: () => _showDriveDetails(context, drive, driveDate),
                  icon: const Icon(LucideIcons.info, size: 16),
                  label: const Text('Details'),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildMiniInfo(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey[500]),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ],
    );
  }

  Map<String, dynamic> _checkEligibility(Map<String, dynamic> drive, Map<String, dynamic> student) {
    final criteria = drive['eligibilityCriteria'] as Map<String, dynamic>?;
    if (criteria == null) return {'isEligible': true};

    // 1. Branch Check
    final allowedBranches = List<String>.from(criteria['branches'] ?? []);
    if (allowedBranches.isNotEmpty && !allowedBranches.contains(student['department'])) {
      return {'isEligible': false, 'reason': 'Dept mismatch'};
    }

    // 2. CGPA Check
    final double minCGPA = (criteria['minCGPA'] ?? 0).toDouble();
    final double studentCGPA = (student['cgpa'] ?? 0).toDouble();
    if (studentCGPA < minCGPA) {
      return {'isEligible': false, 'reason': 'CGPA < $minCGPA'};
    }

    // 3. Backlogs/Arrears Check
    // Handle 'backlogsAllowed' vs 'standingArrears' (user map says standingArrears in one place, backlogsAllowed in another)
    // We'll treat criteria['standingArrears'] as the max allowed standing arrears.
    final int maxStandingArrears = (criteria['standingArrears'] ?? 0).toInt();
    final int studentStandingArrears = int.tryParse(student['standingArreas']?.toString() ?? '0') ?? 0;
    
    if (studentStandingArrears > maxStandingArrears) {
      return {'isEligible': false, 'reason': 'Standing Arrears > $maxStandingArrears'};
    }
    
    // 4. History of Arrears
    final int maxHistoryArrears = (criteria['historyOfArrears'] ?? 100).toInt();
    final int studentHistoryArrears = int.tryParse(student['historyOfArreas']?.toString() ?? '0') ?? 0;
    if (studentHistoryArrears > maxHistoryArrears) {
        return {'isEligible': false, 'reason': 'History Arrears > $maxHistoryArrears'};
    }

    return {'isEligible': true};
  }

  Future<void> _handleAction(BuildContext context, String companyId, String action, String uid) async {
    try {
      final docRef = FirebaseFirestore.instance.collection('companies').doc(companyId);
      
      if (action == 'opt-in') {
        await docRef.update({
          'applicants': FieldValue.arrayUnion([uid])
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Opted In Successfully!')));
      } else {
        await docRef.update({
          'optedOut': FieldValue.arrayUnion([uid])
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Opted Out Successfully')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showDriveDetails(BuildContext context, Map<String, dynamic> drive, DateTime? driveDate) {
    // Parse Deadline
    DateTime? deadline;
    if (drive['deadline'] is int) {
      deadline = DateTime.fromMillisecondsSinceEpoch(drive['deadline']);
    }

    final eligibility = drive['eligibilityCriteria'] as Map<String, dynamic>? ?? {};

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
              ),
              Expanded(
                child: ListView(
                  controller: controller,
                  children: [
                    // Header
                    Text(drive['name'] ?? 'Unknown', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppTheme.primary900)),
                    const SizedBox(height: 4),
                    Text(drive['type'] ?? 'Company', style: TextStyle(fontSize: 16, color: Colors.grey[600], fontWeight: FontWeight.w500)),
                    
                    const SizedBox(height: 24),
                    
                    // Key Info Grid
                    Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: [
                        _buildInfoChip(LucideIcons.indianRupee, '${drive['salary'] ?? 'N/A'}', 'Salary'),
                        if (driveDate != null)
                          _buildInfoChip(LucideIcons.calendar, DateFormat('MMM d, yyyy').format(driveDate), 'Drive Date'),
                         if (deadline != null)
                          _buildInfoChip(LucideIcons.clock, DateFormat('MMM d, yyyy').format(deadline), 'Deadline'),
                      ],
                    ),
                    
                    const Divider(height: 48),

                    // Job Description
                    _buildSectionTitle('Job Description'),
                    Text(
                      drive['description'] ?? 'No description provided.',
                      style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87),
                    ),
                    
                    const SizedBox(height: 24),

                    // Roles
                    if (drive['roles'] != null && (drive['roles'] as List).isNotEmpty) ...[
                      _buildSectionTitle('Roles'),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: (drive['roles'] as List).map((role) => 
                          Chip(
                            label: Text(role.toString()),
                            backgroundColor: AppTheme.primary50,
                            labelStyle: const TextStyle(color: AppTheme.primary700),
                            side: BorderSide.none,
                          )
                        ).toList(),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Key Requirements
                    if (drive['requirements'] != null && (drive['requirements'] as List).isNotEmpty) ...[
                      _buildSectionTitle('Key Requirements'),
                      ...((drive['requirements'] as List).map((req) => 
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 6),
                                child: Icon(Icons.circle, size: 6, color: AppTheme.primary600),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: Text(req.toString(), style: const TextStyle(fontSize: 15))),
                            ],
                          ),
                        )
                      )),
                      const SizedBox(height: 24),
                    ],

                    // Selection Process
                    if (drive['rounds'] != null && (drive['rounds'] as List).isNotEmpty) ...[
                      _buildSectionTitle('Selection Process (Rounds)'),
                      ListView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: (drive['rounds'] as List).length,
                        itemBuilder: (context, index) {
                          final rounds = drive['rounds'] as List;
                          final isLast = index == rounds.length - 1;
                          
                          return IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Column(
                                  children: [
                                    Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        color: AppTheme.primary600,
                                        shape: BoxShape.circle,
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        '${index + 1}',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                    ),
                                    if (!isLast)
                                      Expanded(
                                        child: Container(
                                          width: 2,
                                          color: Colors.blue.withOpacity(0.2), // AppTheme.primary100 equivalent
                                          margin: const EdgeInsets.symmetric(vertical: 4),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.only(top: 4, bottom: 24),
                                    child: Text(
                                      rounds[index].toString(),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Eligibility Criteria
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Eligibility Criteria'),
                          const SizedBox(height: 8),
                          _buildEligibilityRow('Min CGPA', '${eligibility['minCGPA'] ?? '-'}'),
                          _buildEligibilityRow('History of Arrears', '${eligibility['historyOfArrears'] ?? '-'}'),
                          _buildEligibilityRow('Standing Arrears', '${eligibility['standingArrears'] ?? '-'}'),
                          _buildEligibilityRow('10th Mark', '${eligibility['sslc'] ?? '-'}%'),
                          _buildEligibilityRow('12th Mark', '${eligibility['hsc'] ?? '-'}%'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppTheme.primary900,
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, String subLabel) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: AppTheme.primary600),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(subLabel, style: TextStyle(fontSize: 10, color: Colors.grey[600], fontWeight: FontWeight.bold)),
              Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEligibilityRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        ],
      ),
    );
  }
}
