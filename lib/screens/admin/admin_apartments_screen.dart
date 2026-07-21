import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/apartment.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../services/language_service.dart';

class AdminApartmentsScreen extends StatefulWidget {
  const AdminApartmentsScreen({super.key});

  @override
  State<AdminApartmentsScreen> createState() => _AdminApartmentsScreenState();
}

class _AdminApartmentsScreenState extends State<AdminApartmentsScreen> {
  List<Apartment> _apartments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadApartments();
  }

  Future<void> _loadApartments() async {
    setState(() => _isLoading = true);
    try {
      final apartments = await ApiService.getAdminApartments();
      if (mounted) {
        setState(() {
          _apartments = apartments;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${LanguageService.tr('failed_load_apartments')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showApartmentDialog({Apartment? apartment}) {
    showDialog(
      context: context,
      builder: (context) => ApartmentFormDialog(
        apartment: apartment,
        onSaved: () {
          _loadApartments();
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
        onRefresh: _loadApartments,
        child: ListView.builder(
          padding: const EdgeInsets.all(8),
          itemCount: _apartments.length,
          itemBuilder: (context, index) {
            final apt = _apartments[index];
            return Card(
              child: ListTile(
                leading: apt.primaryImage.isNotEmpty
                    ? Image.network(
                        ApiService.resolveImageUrl(apt.primaryImage),
                        width: 50,
                        height: 50,
                        fit: BoxFit.cover,
                      )
                    : const Icon(Icons.image, size: 50),
                title: Text(apt.title),
                subtitle: Text('\$${apt.price} - ${apt.status == 'available' ? LanguageService.tr('available') : apt.status}'),
                trailing: IconButton(
                  icon: const Icon(Icons.edit, color: AppColors.primary),
                  onPressed: () => _showApartmentDialog(apartment: apt),
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showApartmentDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class ApartmentFormDialog extends StatefulWidget {
  final Apartment? apartment;
  final VoidCallback onSaved;

  const ApartmentFormDialog({super.key, this.apartment, required this.onSaved});

  @override
  State<ApartmentFormDialog> createState() => _ApartmentFormDialogState();
}

class _ApartmentFormDialogState extends State<ApartmentFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _capacityController = TextEditingController();
  String _districtId = '1';
  bool _isAvailable = true;
  bool _isSaving = false;

  final ImagePicker _picker = ImagePicker();
  File? _imageFile;
  String? _existingImageUrl;

  @override
  void initState() {
    super.initState();
    if (widget.apartment != null) {
      _titleController.text = widget.apartment!.title;
      _descriptionController.text = widget.apartment!.description;
      _priceController.text = widget.apartment!.price.toString();
      _capacityController.text = widget.apartment!.capacity.toString();
      _districtId = widget.apartment!.districtId.toString();
      _isAvailable = widget.apartment!.status == 'available';
      if (widget.apartment!.primaryImage.isNotEmpty) {
        _existingImageUrl = widget.apartment!.primaryImage;
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
        imageUrl = await ApiService.uploadImage(_imageFile!, 'apartments');
      }

      final payload = {
        if (widget.apartment != null) 'id': widget.apartment!.id,
        'title': _titleController.text,
        'description': _descriptionController.text,
        'price': double.parse(_priceController.text),
        'capacity': int.parse(_capacityController.text),
        'district_id': int.parse(_districtId),
        'currency': 'USD',
        'status': _isAvailable ? 'available' : 'maintenance',
        if (imageUrl != null) 'images': [
          {
            'url': imageUrl,
            'is_primary': true,
          }
        ],
      };

      bool success;
      if (widget.apartment == null) {
        success = await ApiService.createApartment(payload);
      } else {
        success = await ApiService.updateApartment(payload);
      }

      if (mounted) {
        if (success) {
          widget.onSaved();
          Navigator.of(context).pop();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(LanguageService.tr('failed_save_apartment'))),
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
      title: Text(widget.apartment == null ? 'New Apartment' : 'Edit Apartment'),
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
                decoration: InputDecoration(labelText: LanguageService.tr('price')),
                keyboardType: TextInputType.number,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              TextFormField(
                controller: _capacityController,
                decoration: InputDecoration(labelText: LanguageService.tr('capacity')),
                keyboardType: TextInputType.number,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              DropdownButtonFormField<String>(
                initialValue: _districtId,
                decoration: InputDecoration(labelText: LanguageService.tr('district_id')),
                items: ['1', '2'].map((e) => DropdownMenuItem(value: e, child: Text('${LanguageService.tr('district')} $e'))).toList(),
                onChanged: (v) => setState(() => _districtId = v!),
              ),
              SwitchListTile(
                title: Text(LanguageService.tr('available')),
                value: _isAvailable,
                onChanged: (v) => setState(() => _isAvailable = v),
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
