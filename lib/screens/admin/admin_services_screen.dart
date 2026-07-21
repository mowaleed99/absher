import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../services/language_service.dart';

class AdminServicesScreen extends StatefulWidget {
  const AdminServicesScreen({super.key});

  @override
  State<AdminServicesScreen> createState() => _AdminServicesScreenState();
}

class _AdminServicesScreenState extends State<AdminServicesScreen> {
  List<Map<String, dynamic>> _services = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    setState(() => _isLoading = true);
    try {
      final services = await ApiService.getAdminServices();
      if (mounted) {
        setState(() {
          _services = services;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${LanguageService.tr('failed_load_services')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showServiceDialog({Map<String, dynamic>? service}) {
    showDialog(
      context: context,
      builder: (context) => ServiceFormDialog(
        service: service,
        onSaved: () {
          _loadServices();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadServices,
        child: ListView.builder(
          padding: const EdgeInsets.all(8),
          itemCount: _services.length,
          itemBuilder: (context, index) {
            final srv = _services[index];
            final bool isActive = srv['is_active'] == 1 || srv['is_active'] == true || srv['is_active'] == '1';
            return Card(
              child: ListTile(
                leading: (srv['image'] != null && srv['image'].toString().isNotEmpty)
                    ? Image.network(
                        ApiService.resolveImageUrl(srv['image']),
                        width: 50,
                        height: 50,
                        fit: BoxFit.cover,
                      )
                    : const Icon(Icons.miscellaneous_services, size: 50),
                title: Text(srv['title'] ?? ''),
                subtitle: Text('${srv['price_points']} Points - ${isActive ? LanguageService.tr('active') : 'Inactive'}'),
                trailing: IconButton(
                  icon: const Icon(Icons.edit, color: AppColors.primary),
                  onPressed: () => _showServiceDialog(service: srv),
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showServiceDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class ServiceFormDialog extends StatefulWidget {
  final Map<String, dynamic>? service;
  final VoidCallback onSaved;

  const ServiceFormDialog({super.key, this.service, required this.onSaved});

  @override
  State<ServiceFormDialog> createState() => _ServiceFormDialogState();
}

class _ServiceFormDialogState extends State<ServiceFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  bool _isActive = true;
  bool _isSaving = false;

  final ImagePicker _picker = ImagePicker();
  File? _imageFile;
  String? _existingImageUrl;

  @override
  void initState() {
    super.initState();
    if (widget.service != null) {
      _titleController.text = widget.service!['title'] ?? '';
      _descriptionController.text = widget.service!['description'] ?? '';
      _priceController.text = widget.service!['price_points']?.toString() ?? '0';
      _isActive = widget.service!['is_active'] == 1 || widget.service!['is_active'] == true || widget.service!['is_active'] == '1';
      if (widget.service!['image'] != null && widget.service!['image'].toString().isNotEmpty) {
        _existingImageUrl = widget.service!['image'];
      }
    }
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
        _existingImageUrl = null;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      String? imageUrl = _existingImageUrl;

      if (_imageFile != null) {
        imageUrl = await ApiService.uploadImage(_imageFile!, 'services');
      }

      final payload = {
        if (widget.service != null) 'id': widget.service!['id'],
        'title': _titleController.text,
        'description': _descriptionController.text,
        'price_points': int.parse(_priceController.text),
        'is_active': _isActive ? 1 : 0,
        if (imageUrl != null) 'image': imageUrl,
      };

      bool success;
      if (widget.service == null) {
        success = await ApiService.createService(payload);
      } else {
        success = await ApiService.updateService(payload);
      }

      if (mounted) {
        if (success) {
          widget.onSaved();
          Navigator.of(context).pop();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(LanguageService.tr('failed_save_service'))),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${LanguageService.tr('error')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.service == null ? 'New Service' : 'Edit Service'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 150,
                  width: double.infinity,
                  color: Colors.grey[200],
                  child: _imageFile != null
                      ? Image.file(_imageFile!, fit: BoxFit.cover)
                      : _existingImageUrl != null
                          ? Image.network(ApiService.resolveImageUrl(_existingImageUrl!), fit: BoxFit.cover)
                          : const Icon(Icons.add_a_photo, size: 50, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(labelText: LanguageService.tr('title')),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(labelText: LanguageService.tr('description')),
                maxLines: 3,
              ),
              TextFormField(
                controller: _priceController,
                decoration: InputDecoration(labelText: LanguageService.tr('price_points')),
                keyboardType: TextInputType.number,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              SwitchListTile(
                title: Text(LanguageService.tr('active')),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(LanguageService.tr('cancel')),
        ),
        ElevatedButton(
          onPressed: _isSaving ? null : _save,
          child: _isSaving ? const CircularProgressIndicator() : Text(LanguageService.tr('save')),
        ),
      ],
    );
  }
}
