// File: lib/firebase_options.dart
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// Example:
/// ```dart
/// import 'firebase_options.dart';
/// // ...
/// await Firebase.initializeApp(
///   options: DefaultFirebaseOptions.currentPlatform,
/// );
/// ```
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAoPVoJmFKxkbgb1LxblJJ_Egb-vOv2uT8',
    appId: '1:118748980768:web:69a57dbe92a3f85cc2be45',
    messagingSenderId: '118748980768',
    projectId: 'test-b6e4c',
    authDomain: 'test-b6e4c.firebaseapp.com',
    storageBucket: 'test-b6e4c.firebasestorage.app',
    measurementId: 'G-BPC1XD2G1M',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAoPVoJmFKxkbgb1LxblJJ_Egb-vOv2uT8',
    appId: '1:118748980768:web:69a57dbe92a3f85cc2be45', // Reusing web appID for now as placeholder
    messagingSenderId: '118748980768',
    projectId: 'test-b6e4c',
    storageBucket: 'test-b6e4c.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAoPVoJmFKxkbgb1LxblJJ_Egb-vOv2uT8',
    appId: '1:118748980768:web:69a57dbe92a3f85cc2be45', // Reusing web appID for now as placeholder
    messagingSenderId: '118748980768',
    projectId: 'test-b6e4c',
    storageBucket: 'test-b6e4c.firebasestorage.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyAoPVoJmFKxkbgb1LxblJJ_Egb-vOv2uT8',
    appId: '1:118748980768:web:69a57dbe92a3f85cc2be45', // Reusing web appID for now as placeholder
    messagingSenderId: '118748980768',
    projectId: 'test-b6e4c',
    storageBucket: 'test-b6e4c.firebasestorage.app',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyAoPVoJmFKxkbgb1LxblJJ_Egb-vOv2uT8',
    appId: '1:118748980768:web:69a57dbe92a3f85cc2be45', // Reusing web appID for now as placeholder
    messagingSenderId: '118748980768',
    projectId: 'test-b6e4c',
    storageBucket: 'test-b6e4c.firebasestorage.app',
    authDomain: 'test-b6e4c.firebaseapp.com',
  );
}
