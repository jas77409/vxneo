import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class NeoTheme {
  static const Color bg        = Color(0xFF04080f);
  static const Color bg2       = Color(0xFF0a1020);
  static const Color navy      = Color(0xFF0d1829);
  static const Color blue      = Color(0xFF3b82f6);
  static const Color cyan      = Color(0xFF06b6d4);
  static const Color green     = Color(0xFF10b981);
  static const Color white     = Color(0xFFf0f4ff);
  static const Color muted     = Color(0xFF6b7a99);
  static const Color border    = Color(0xFF1a2540);
  static const Color textPrimary   = Color(0xFFf0f4ff);
  static const Color textSecondary = Color(0xFFb8c8e0);

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bg,
    colorScheme: const ColorScheme.dark(
      primary: blue,
      secondary: cyan,
      surface: bg2,
      background: bg,
      onPrimary: white,
      onSecondary: white,
      onSurface: textPrimary,
      onBackground: textPrimary,
    ),
    textTheme: GoogleFonts.dmMonoTextTheme(
      const TextTheme(
        displayLarge:  TextStyle(color: textPrimary, fontWeight: FontWeight.w700),
        displayMedium: TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
        headlineLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.w700),
        headlineMedium:TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
        titleLarge:    TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
        bodyLarge:     TextStyle(color: textSecondary),
        bodyMedium:    TextStyle(color: textSecondary),
        labelLarge:    TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: bg,
      elevation: 0,
      foregroundColor: textPrimary,
      titleTextStyle: TextStyle(
        color: textPrimary, fontSize: 17, fontWeight: FontWeight.w600,
        fontFamily: 'Georgia',
      ),
    ),
    cardTheme: CardThemeData(
      color: bg2,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: border, width: 0.5),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: bg2,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: blue, width: 1.5),
      ),
      hintStyle: const TextStyle(color: muted),
      labelStyle: const TextStyle(color: muted),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: blue,
        foregroundColor: white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0.5),
      ),
    ),
    dividerColor: border,
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: bg2,
      selectedItemColor: blue,
      unselectedItemColor: muted,
      elevation: 0,
    ),
  );
}
