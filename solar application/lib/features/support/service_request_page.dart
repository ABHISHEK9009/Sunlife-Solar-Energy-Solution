import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/models/service_ticket.dart';
import '../../core/repositories/support_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/sub_page.dart';

class ServiceRequestPage extends StatefulWidget {
  const ServiceRequestPage({
    super.key,
    this.initialCategory = 'Project status query',
  });

  final String initialCategory;

  @override
  State<ServiceRequestPage> createState() => _ServiceRequestPageState();
}

class _ServiceRequestPageState extends State<ServiceRequestPage> {
  late String category = widget.initialCategory;
  final description = TextEditingController();
  String? _attachedPhotoPath;
  String? _validationError;
  bool _isSubmitting = false;
  ServiceTicket? _createdTicket;

  @override
  void dispose() {
    description.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    try {
      final picker = ImagePicker();
      final photo = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );
      if (photo != null && mounted) {
        setState(() => _attachedPhotoPath = photo.path);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not access photo gallery')),
        );
      }
    }
  }

  Future<void> _submit() async {
    final text = description.text.trim();
    if (text.isEmpty) {
      setState(() => _validationError = 'Please describe your query or request');
      return;
    }

    setState(() {
      _validationError = null;
      _isSubmitting = true;
    });

    try {
      final ticket = await SupportRepository.instance.createTicket(
        category: category,
        description: text,
        attachmentPath: _attachedPhotoPath,
      );

      if (mounted) {
        setState(() {
          _createdTicket = ticket;
          _isSubmitting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _validationError = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_createdTicket != null) {
      final ticket = _createdTicket!;
      return SubPage(
        title: 'Request submitted',
        children: [
          const SizedBox(height: 50),
          const Icon(Icons.check_circle, color: AppColors.green, size: 82),
          const SizedBox(height: 20),
          Center(
            child: Text(
              'Ticket #${ticket.id} created',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'Our support team will contact you ${ticket.expectedResponse.toLowerCase()}.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted),
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            height: 52,
            child: FilledButton(
              onPressed: () => Navigator.pop(context),
              style: FilledButton.styleFrom(backgroundColor: AppColors.ink),
              child: const Text(
                'Done',
                style: TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ],
      );
    }

    return SubPage(
      title: 'New support request',
      bottom: SizedBox(
        width: double.infinity,
        height: 54,
        child: FilledButton(
          onPressed: _isSubmitting ? null : _submit,
          style: FilledButton.styleFrom(backgroundColor: AppColors.ink),
          child: _isSubmitting
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                )
              : const Text(
                  'Submit request',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
        ),
      ),
      children: [
        const Text(
          'What do you need help with?',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: category,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
          ),
          items: const [
            'Project status query',
            'Document help',
            'Payment query',
            'Subsidy query',
            'Installation issue',
            'Warranty or service',
            'Other',
          ]
              .map(
                (item) => DropdownMenuItem(value: item, child: Text(item)),
              )
              .toList(),
          onChanged: (value) => setState(() => category = value!),
        ),
        const SizedBox(height: 18),
        const Text(
          'Describe your query or request',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: description,
          minLines: 4,
          maxLines: 6,
          onChanged: (_) {
            if (_validationError != null) {
              setState(() => _validationError = null);
            }
          },
          decoration: InputDecoration(
            hintText: 'Share the details our support team should know…',
            errorText: _validationError,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 18),
        if (_attachedPhotoPath != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(_attachedPhotoPath!),
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const Icon(Icons.image, size: 40),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Photo attached',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                IconButton(
                  onPressed: () => setState(() => _attachedPhotoPath = null),
                  icon: const Icon(Icons.close, color: AppColors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        OutlinedButton.icon(
          onPressed: _pickPhoto,
          icon: const Icon(Icons.add_a_photo_outlined),
          label: Text(_attachedPhotoPath == null ? 'Add photo or document' : 'Change photo'),
        ),
        const SizedBox(height: 14),
        const Text(
          'Please avoid sharing passwords, OTPs or bank account credentials.',
          style: TextStyle(color: AppColors.muted, fontSize: 12),
        ),
      ],
    );
  }
}
