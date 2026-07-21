import 'package:flutter/material.dart';
import '../../models/student.dart';
import '../../services/api_service.dart';
import '../../services/language_service.dart';

class AdminStudentsScreen extends StatefulWidget {
  const AdminStudentsScreen({super.key});

  @override
  State<AdminStudentsScreen> createState() => _AdminStudentsScreenState();
}

class _AdminStudentsScreenState extends State<AdminStudentsScreen> {
  List<Student> _students = [];
  bool _isLoading = true;
  int _page = 1;
  bool _hasMore = true;
  String _searchQuery = '';
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadStudents();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 && !_isLoading && _hasMore) {
      _loadMore();
    }
  }

  Future<void> _loadStudents({bool refresh = false}) async {
    if (refresh) {
      _page = 1;
      _hasMore = true;
      _students.clear();
    }

    setState(() => _isLoading = true);
    try {
      final students = await ApiService.getAdminStudents(page: _page, limit: 20, search: _searchQuery);
      if (mounted) {
        setState(() {
          if (refresh) {
            _students = students;
          } else {
            _students.addAll(students);
          }
          if (students.length < 20) {
            _hasMore = false;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${LanguageService.tr('failed_load_students')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMore() async {
    _page++;
    await _loadStudents();
  }

  void _onSearchChanged() {
    _searchQuery = _searchController.text;
    _loadStudents(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: LanguageService.tr('search_students'),
            border: InputBorder.none,
            suffixIcon: IconButton(
              icon: const Icon(Icons.search),
              onPressed: _onSearchChanged,
            ),
          ),
          onSubmitted: (_) => _onSearchChanged(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadStudents(refresh: true),
        child: ListView.builder(
          controller: _scrollController,
          itemCount: _students.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _students.length) {
              return const Padding(
                padding: EdgeInsets.all(16.0),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final student = _students[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: ListTile(
                leading: CircleAvatar(
                  child: Text(student.fullName.isNotEmpty ? student.fullName[0].toUpperCase() : '?'),
                ),
                title: Text(student.fullName),
                subtitle: Text(student.email ?? ''),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  _showStudentDetails(student);
                },
              ),
            );
          },
        ),
      ),
    );
  }

  void _showStudentDetails(Student student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(student.fullName),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${LanguageService.tr('email')}: ${student.email ?? ''}'),
            const SizedBox(height: 8),
            Text('Phone: ${student.phone ?? 'N/A'}'),
            const SizedBox(height: 8),
            Text('University: ${student.universityId?.toString() ?? 'N/A'}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(LanguageService.tr('close')),
          ),
          // Add soft delete if needed
        ],
      ),
    );
  }
}
