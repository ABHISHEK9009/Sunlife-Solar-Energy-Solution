import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/models/field_visit.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/sub_page.dart';

class AgentVisitDetailPage extends StatefulWidget {
  const AgentVisitDetailPage({super.key, required this.customer});

  final String customer;

  @override
  State<AgentVisitDetailPage> createState() => _AgentVisitDetailPageState();
}

class _AgentVisitDetailPageState extends State<AgentVisitDetailPage> {
  final checks = <bool>[false, false, false, false];
  final List<String> _photos = [];
  double? _latitude;
  double? _longitude;
  bool _isGettingLocation = false;
  bool _isSaving = false;
  FieldVisit? _visit;

  static const labels = [
    'Confirm customer and property details',
    'Capture rooftop measurements',
    'Check shadow-free installation area',
    'Upload site photographs',
  ];

  @override
  void initState() {
    super.initState();
    _loadVisitData();
  }

  Future<void> _loadVisitData() async {
    final visit = await AgentRepository.instance.getVisitForCustomer(widget.customer);
    if (visit != null && mounted) {
      setState(() {
        _visit = visit;
        for (var i = 0; i < checks.length && i < visit.checklist.length; i++) {
          checks[i] = visit.checklist[i];
        }
        _latitude = visit.latitude;
        _longitude = visit.longitude;
        _photos.clear();
        _photos.addAll(visit.photoPaths);
      });
    }
  }

  Future<void> _captureGps() async {
    setState(() => _isGettingLocation = true);

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _isGettingLocation = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location services are disabled on this device. Please turn on GPS.')),
          );
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _isGettingLocation = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Location permissions are denied.')),
            );
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() => _isGettingLocation = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permissions are permanently denied. Please enable in Settings.')),
          );
        }
        return;
      }

      final Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      if (mounted) {
        setState(() {
          _latitude = position.latitude;
          _longitude = position.longitude;
          _isGettingLocation = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.deepGreen,
            content: Text('GPS Captured: ${position.latitude.toStringAsFixed(4)}°N, ${position.longitude.toStringAsFixed(4)}°E'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isGettingLocation = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not acquire accurate GPS coordinates. Please try again.')),
        );
      }
    }
  }

  Future<void> _addPhoto() async {
    try {
      final picker = ImagePicker();
      final photo = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 75,
      );

      if (photo != null && mounted) {
        setState(() {
          _photos.add(photo.path);
          checks[3] = true; // Auto-mark photos checklist
        });
        AgentRepository.instance.updateVisitChecklist(widget.customer, 3, true);
      }
    } catch (_) {
      // Fallback to gallery
      try {
        final picker = ImagePicker();
        final photo = await picker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 75,
        );
        if (photo != null && mounted) {
          setState(() {
            _photos.add(photo.path);
            checks[3] = true;
          });
          AgentRepository.instance.updateVisitChecklist(widget.customer, 3, true);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open camera or gallery')),
          );
        }
      }
    }
  }

  Future<void> _completeVisit() async {
    setState(() => _isSaving = true);

    try {
      await AgentRepository.instance.completeVisit(
        widget.customer,
        latitude: _latitude,
        longitude: _longitude,
        photoPaths: _photos,
      );

      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.deepGreen,
            content: Text('${widget.customer} site survey completed & saved to CRM'),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade700,
            content: Text('Failed to complete survey: $e'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final purpose = _visit?.purpose.toUpperCase() ?? 'SITE SURVEY';
    final time = _visit?.time ?? '--:--';
    final location = _visit?.location ?? 'Scheduled Site';

    return SubPage(
      title: 'Visit checklist',
      onRefresh: _loadVisitData,
      bottom: SizedBox(
        width: double.infinity,
        height: 54,
        child: FilledButton.icon(
          onPressed: _isSaving ? null : _completeVisit,
          style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
          icon: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Icon(Icons.check_circle_outline_rounded),
          label: const Text(
            'Complete visit',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
      ),
      children: [
        CardBox(
          color: AppColors.deepGreen,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$purpose · $time',
                style: const TextStyle(
                  color: Colors.white60,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.customer,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 23,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                location,
                style: const TextStyle(color: Colors.white70),
              ),
                if (_latitude != null && _longitude != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'GPS: ${_latitude!.toStringAsFixed(4)}°N, ${_longitude!.toStringAsFixed(4)}°E',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Heading('Required checks'),
          const SizedBox(height: 10),
          CardBox(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Column(
              children: [
                for (var i = 0; i < labels.length; i++)
                  CheckboxListTile(
                    value: checks[i],
                    onChanged: (value) {
                      setState(() => checks[i] = value!);
                      AgentRepository.instance.updateVisitChecklist(
                        widget.customer,
                        i,
                        value!,
                      );
                    },
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                    title: Text(
                      labels[i],
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _addPhoto,
                  icon: const Icon(Icons.add_a_photo_outlined),
                  label: Text(_photos.isEmpty ? 'Add photos' : 'Add photo (${_photos.length})'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isGettingLocation ? null : _captureGps,
                  icon: _isGettingLocation
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(
                          _latitude != null ? Icons.check_circle : Icons.my_location_rounded,
                          color: _latitude != null ? AppColors.green : null,
                        ),
                  label: Text(_latitude != null ? 'GPS Logged' : 'Capture GPS'),
                ),
              ),
            ],
          ),
          if (_photos.isNotEmpty) ...[
            const SizedBox(height: 14),
            SizedBox(
              height: 70,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _photos.length,
                itemBuilder: (context, index) => Container(
                  margin: const EdgeInsets.only(right: 10),
                  width: 70,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.white,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.file(
                    File(_photos[index]),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const Icon(Icons.roofing_rounded),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 76),
        ],
      );
  }
}
