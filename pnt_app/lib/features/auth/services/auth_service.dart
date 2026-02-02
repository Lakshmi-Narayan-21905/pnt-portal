import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  
  User? _user;
  Map<String, dynamic>? _userProfile;
  bool _isLoading = true;
  String? _error;

  User? get user => _user;
  Map<String, dynamic>? get userProfile => _userProfile;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get userRole => _userProfile?['role']?.toString().trim().toLowerCase();

  AuthService() {
    _auth.authStateChanges().listen((User? user) async {
      _user = user;
      if (user != null) {
        await _fetchUserProfile(user.uid);
      } else {
        _userProfile = null;
      }
      _isLoading = false;
      notifyListeners();
    });
  }

  // Collections to search for user profile
  static const List<String> _roleCollections = [
    'students',
    'admin',
    'placement_heads',
    'training_heads',
    'dept_coordinators',
    'class_coordinators',
  ];

  Future<void> _fetchUserProfile(String uid) async {
    try {
      _error = null;
      Map<String, dynamic>? foundProfile;

      // Check all collections in parallel
      final futures = _roleCollections.map((col) => _db.collection(col).doc(uid).get());
      final snapshots = await Future.wait(futures);

      for (var doc in snapshots) {
        if (doc.exists) {
          foundProfile = doc.data();
          break; // Stop at first match
        }
      }

      if (foundProfile != null) {
        _userProfile = foundProfile;
        notifyListeners();
      } else {
        // Fallback: check legacy 'users' collection just in case
        final legacyDoc = await _db.collection('users').doc(uid).get();
        if (legacyDoc.exists) {
          _userProfile = legacyDoc.data();
          notifyListeners();
        } else {
          _error = "User profile not found. ID: $uid";
          _userProfile = null;
          notifyListeners();
        }
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Error fetching user profile: $e');
      notifyListeners();
    }
  }

  // Sign in with email and password
  Future<void> signIn(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(email: email, password: password);
      if (credential.user != null) {
        await _fetchUserProfile(credential.user!.uid);
      }
    } catch (e) {
      debugPrint('Error signing in: $e');
      rethrow;
    }
  }

  // Password Reset
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      debugPrint('Error sending password reset email: $e');
      rethrow;
    }
  }

  // Sign out
  Future<void> signOut() async {
    await _auth.signOut();
    _userProfile = null;
    notifyListeners();
  }
}
