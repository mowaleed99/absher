class OfflineException implements Exception {
  final String message;
  OfflineException([this.message = "No Internet Connection"]);

  @override
  String toString() => message;
}
