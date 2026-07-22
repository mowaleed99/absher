import 'dart:typed_data';
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
                leading: (srv['image_url'] != null && srv['image_url'].toString().isNotEmpty)
                    ? Image.network(
                        ApiService.resolveImageUrl(srv['image_url']),
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
  XFile? _imageFile;
  Uint8List? _imageBytes;
  String? _existingImageUrl;

  @override
  void initState() {
    super.initState();
    if (widget.service != null) {
      _titleController.text = widget.service!['title'] ?? '';
      _descriptionController.text = widget.service!['description'] ?? '';
      _priceController.text = widget.service!['price_points']?.toString() ?? '0';
      // has_form: does this service require a request form?
      _isActive = widget.service!['has_form'] == 1 || widget.service!['has_form'] == true || widget.service!['has_form'] == '1';
      if (widget.service!['image_url'] != null && widget.service!['image_url'].toString().isNotEmpty) {
        _existingImageUrl = widget.service!['image_url'];
      }
    }
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      setState(() {
        _imageFile = pickedFile;
        _imageBytes = bytes;
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
        'price_points': int.tryParse(_priceController.text) ?? 0,
        // has_form: server field indicates whether service presents a request form
        'has_form': _isActive ? 1 : 0,
        // image_url: matches the column name in the services table
        if (imageUrl != null) 'image_url': imageUrl,
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
                  child: _imageBytes != null
                      ? Image.memory(_imageBytes!, fit: BoxFit.cover)
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
                // has_form: indicates whether this service shows a request form to students
                title: const Text('Requires form'),
                subtitle: const Text('Student sees a request form for this service'),
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
