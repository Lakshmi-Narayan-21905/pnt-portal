import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Primary Colors (from Tailwind config)
  static const Color primary50 = Color(0xFFF0F9FF);
  static const Color primary100 = Color(0xFFE0F2FE);
  static const Color primary200 = Color(0xFFB9E6FE);
  static const Color primary300 = Color(0xFF7CD3FD);
  static const Color primary400 = Color(0xFF36BFFA);
  static const Color primary500 = Color(0xFF0CA5E9);
  static const Color primary600 = Color(0xFF0284C7);
  static const Color primary700 = Color(0xFF0369A1);
  static const Color primary800 = Color(0xFF075985);
  static const Color primary900 = Color(0xFF0C4A6E);

  // Background Colors
  static const Color scaffoldBackground = Color(0xFFF0F9FF); // primary-50 equivalent
  static const Color glassBorder = Color(0x80FFFFFF);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary600,
        primary: primary600,
        secondary: primary500,
        background: scaffoldBackground,
      ),
      scaffoldBackgroundColor: scaffoldBackground,
      textTheme: GoogleFonts.interTextTheme(),
      cardTheme: CardThemeData(
        color: Colors.white.withOpacity(0.8),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: glassBorder),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary500, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary600,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
      ),
    );
  }

  static BoxDecoration get glassDecoration => BoxDecoration(
    color: Colors.white.withOpacity(0.7),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: Colors.white.withOpacity(0.5)),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.05),
        blurRadius: 24,
        offset: const Offset(0, 8),
      ),
    ],
  );
}
