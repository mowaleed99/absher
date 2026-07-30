class Env {
  // Set this to false for production
  static const bool isDevelopment = false;

  // Development API URL
  static const String devApiBaseUrl =
      'http://192.168.1.5/absher/backend_php/api';

  // Production API URL
  static const String prodApiBaseUrl = 'http://80.241.218.23/api';

  // Computed Base URL
  static String get apiBaseUrl =>
      isDevelopment ? devApiBaseUrl : prodApiBaseUrl;
}
