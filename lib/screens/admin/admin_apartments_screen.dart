import 'dart:typed_data';
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
        child: _apartments.isEmpty
            ? const Center(child: Text('No apartments yet'))
            : ListView.builder(
                padding: const EdgeInsets.all(8),
                itemCount: _apartments.length,
                itemBuilder: (context, index) {
                  final apt = _apartments[index];
                  final isAvailable = apt.status == 'available' || apt.status == null;
                  return Card(
                    child: ListTile(
                      leading: apt.primaryImage.isNotEmpty
                          ? Image.network(
                              ApiService.resolveImageUrl(apt.primaryImage),
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(Icons.image, size: 50),
                            )
                          : const Icon(Icons.image, size: 50),
                      title: Text(apt.title),
                      subtitle: Text(
                        '${apt.price} — ${apt.district.isNotEmpty ? apt.district : 'No location'}',
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isAvailable ? Icons.check_circle : Icons.cancel,
                            color: isAvailable ? Colors.green : Colors.grey,
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          IconButton(
                            icon: const Icon(Icons.edit, color: AppColors.primary),
                            onPressed: () => _showApartmentDialog(apartment: apt),
                          ),
                        ],
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

  // Text controllers — match real `apartments` table schema
  final _titleController = TextEditingController();
  final _priceController = TextEditingController();       // varchar
  final _locationController = TextEditingController();    // varchar (was district_id)
  final _proximityController = TextEditingController();   // varchar
  final _capacityController = TextEditingController();    // varchar (e.g. "3 أفراد")
  final _moveInTypeController = TextEditingController();  // varchar (e.g. "فوري")
  final _moveInDateController = TextEditingController();  // varchar
  final _descriptionController = TextEditingController();

  // Chip-list inputs
  List<String> _features = [];
  List<String> _universities = [];
  final _featureInput = TextEditingController();
  final _universityInput = TextEditingController();

  bool _isAvailable = true;
  bool _isSaving = false;

  final ImagePicker _picker = ImagePicker();
  XFile? _imageFile;
  Uint8List? _imageBytes;
  String? _existingImagePath; // raw path, e.g. /uploads/apartments/file.jpg

  @override
  void initState() {
    super.initState();
    if (widget.apartment != null) {
      final apt = widget.apartment!;
      _titleController.text = apt.title;
      _priceController.text = apt.price;
      _locationController.text = apt.district;
      _proximityController.text = apt.proximity ?? '';
      _descriptionController.text = apt.description;
      _capacityController.text = apt.capacity?.toString() ?? '';
      _moveInTypeController.text = apt.moveInType ?? '';
      _moveInDateController.text = apt.moveInDate ?? '';
      // status: 'available' or anything else
      _isAvailable = apt.status == null || apt.status == 'available';
      if (apt.primaryImage.isNotEmpty) {
        _existingImagePath = apt.primaryImage;
      }
      _features = apt.features.map((f) => f.name).toList();
      _universities = apt.universities.map((u) => u.name).toList();
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _priceController.dispose();
    _locationController.dispose();
    _proximityController.dispose();
    _capacityController.dispose();
    _moveInTypeController.dispose();
    _moveInDateController.dispose();
    _descriptionController.dispose();
    _featureInput.dispose();
    _universityInput.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      setState(() {
        _imageFile = pickedFile;
        _imageBytes = bytes;
        _existingImagePath = null;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      // Upload new image if selected; store raw path (not resolved URL)
      String? imagePath = _existingImagePath;
      if (_imageFile != null) {
        imagePath = await ApiService.uploadImage(_imageFile!, 'apartments');
      }

      // Build images JSON array — store raw paths
      final List<String> imagesArray =
          (imagePath != null && imagePath.isNotEmpty) ? [imagePath] : [];

      // Payload matches admin_api.php add_apartment / update_apartment handlers:
      // title, price, location, proximity, capacity, move_in_type, move_in_date,
      // description, universities[], features[], images[]
      final payload = <String, dynamic>{
        if (widget.apartment != null) 'id': widget.apartment!.id,
        'title': _titleController.text.trim(),
        'price': _priceController.text.trim(),
        'location': _locationController.text.trim(),
        'proximity': _proximityController.text.trim(),
        'capacity': _capacityController.text.trim().isEmpty
            ? '3 أفراد'
            : _capacityController.text.trim(),
        'move_in_type': _moveInTypeController.text.trim().isEmpty
            ? 'فوري'
            : _moveInTypeController.text.trim(),
        'move_in_date': _moveInDateController.text.trim().isEmpty
            ? 'انتقال فوري'
            : _moveInDateController.text.trim(),
        'description': _descriptionController.text.trim(),
        'universities': _universities,
        'features': _features,
        'images': imagesArray,
        // is_available is stored as a column in the table
        'is_available': _isAvailable ? 1 : 0,
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

  void _addFeature() {
    final val = _featureInput.text.trim();
    if (val.isNotEmpty && !_features.contains(val)) {
      setState(() => _features.add(val));
      _featureInput.clear();
    }
  }

  void _addUniversity() {
    final val = _universityInput.text.trim();
    if (val.isNotEmpty && !_universities.contains(val)) {
      setState(() => _universities.add(val));
      _universityInput.clear();
    }
  }

  Widget _buildChipList(List<String> items, void Function(String item) onRemove) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 6,
      children: items
          .map((item) => Chip(
                label: Text(item),
                onDeleted: () => onRemove(item),
              ))
          .toList(),
    );
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image picker
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 130,
                  width: double.infinity,
                  color: Colors.grey[200],
                  child: _imageBytes != null
                      ? Image.memory(_imageBytes!, fit: BoxFit.cover)
                      : _existingImagePath != null
                          ? Image.network(
                              ApiService.resolveImageUrl(_existingImagePath!),
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) =>
                                  const Icon(Icons.add_a_photo, size: 40, color: Colors.grey),
                            )
                          : const Icon(Icons.add_a_photo, size: 40, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(labelText: LanguageService.tr('title')),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              TextFormField(
                controller: _priceController,
                decoration: const InputDecoration(labelText: 'Price (e.g. 350 USD/month)'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(labelText: 'Location / District'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              TextFormField(
                controller: _proximityController,
                decoration: const InputDecoration(labelText: 'Proximity to university'),
              ),
              TextFormField(
                controller: _capacityController,
                decoration: const InputDecoration(labelText: 'Capacity (e.g. 3 أفراد)'),
              ),
              TextFormField(
                controller: _moveInTypeController,
                decoration: const InputDecoration(labelText: 'Move-in type (e.g. فوري)'),
              ),
              TextFormField(
                controller: _moveInDateController,
                decoration: const InputDecoration(labelText: 'Move-in date (e.g. 2025-09-01)'),
              ),
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(labelText: LanguageService.tr('description')),
                maxLines: 3,
              ),
              const SizedBox(height: 8),
              // Features chip input
              const Text('Features', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              _buildChipList(_features, (item) {
                setState(() => _features.remove(item));
              }),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _featureInput,
                      decoration: const InputDecoration(hintText: 'Add feature'),
                      onSubmitted: (_) => _addFeature(),
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.add), onPressed: _addFeature),
                ],
              ),
              const SizedBox(height: 8),
              // Universities chip input
              const Text('Near Universities', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              _buildChipList(_universities, (item) {
                setState(() => _universities.remove(item));
              }),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _universityInput,
                      decoration: const InputDecoration(hintText: 'Add university'),
                      onSubmitted: (_) => _addUniversity(),
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.add), onPressed: _addUniversity),
                ],
              ),
              SwitchListTile(
                title: Text(LanguageService.tr('available')),
                subtitle: const Text('Hide from student app when OFF'),
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
          child: _isSaving
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(LanguageService.tr('save')),
        ),
      ],
    );
  }
}
