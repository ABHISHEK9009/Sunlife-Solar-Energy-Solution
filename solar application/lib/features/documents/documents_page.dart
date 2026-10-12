import '../../core/errors/app_error.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/widgets/data_state.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/models/project_document.dart';
import '../../core/repositories/document_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/pill.dart';
import '../../core/widgets/sub_page.dart';
import 'widgets/document_row.dart';

class DocumentsPage extends StatefulWidget {
  const DocumentsPage({super.key});

  @override
  State<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends State<DocumentsPage> {
  List<ProjectDocument> _docs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    final docs = await DocumentRepository.instance.getDocuments(forceRefresh: true);
    if (mounted) {
      setState(() {
        _docs = docs;
        _isLoading = false;
      });
    }
  }

  IconData _iconForDoc(String title) {
    final t = title.toLowerCase();
    if (t.contains('certificate')) return Icons.verified_outlined;
    if (t.contains('invoice')) return Icons.receipt_long_outlined;
    if (t.contains('quotation')) return Icons.description_outlined;
    if (t.contains('survey')) return Icons.roofing_outlined;
    if (t.contains('panel')) return Icons.shield_outlined;
    if (t.contains('inverter')) return Icons.electrical_services_outlined;
    return Icons.insert_drive_file_outlined;
  }

  void _handleOpen(ProjectDocument doc) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (bottomSheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: AppColors.softGreen,
                    child: Icon(_iconForDoc(doc.title), color: AppColors.deepGreen),
                  ),
                  Pill(doc.isApproved ? 'Approved' : 'Awaiting review', greenText: doc.isApproved),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                doc.title,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                '${doc.type.toUpperCase()} • ${doc.size.isNotEmpty ? doc.size : "Size unavailable"} • Issued by Sunlife Solar Pvt. Ltd.',
                style: const TextStyle(color: AppColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 18),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.picture_as_pdf_rounded, size: 48, color: Color(0xFFE11D48)),
                    const SizedBox(height: 8),
                    Text(
                      '${doc.title}.${doc.type}',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Your project document',
                      style: TextStyle(color: AppColors.muted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        const prjCode = 'from Sunlife Solar';
                        SharePlus.instance.share(
                          ShareParams(
                            text: 'Sunlife Solar Document: ${doc.title} (${doc.type.toUpperCase()})\nDocument $prjCode',
                            subject: doc.title,
                          ),
                        );
                      },
                      icon: const Icon(Icons.share_rounded),
                      label: const Text('Share'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
                      onPressed: () {
                        Navigator.pop(bottomSheetContext);
                        _handleDownload(doc);
                      },
                      icon: const Icon(Icons.download_rounded),
                      label: const Text('Download'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleDownload(ProjectDocument doc) async {
    try {
      final uri = Uri.tryParse(doc.url ?? '');
      if (uri == null || uri.scheme != 'https' || !uri.hasAuthority || uri.userInfo.isNotEmpty) {
        throw const AppFailure(FailureKind.notFound);
      }
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw const AppFailure(FailureKind.unknown);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorMapper.message(e))));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final loadError = DocumentRepository.instance.lastError;
    if (loadError != null) return Scaffold(body: DataState(message: loadError, onRetry: () async { await _loadDocuments(); }));
    return SubPage(
        title: 'My documents',
        onRefresh: _loadDocuments,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Your approved project files, invoices and warranties.',
                  style: TextStyle(color: AppColors.muted, height: 1.4),
                ),
              ),
              const SizedBox(width: 14),
              Pill('${_docs.length} FILES'),
            ],
          ),
          const SizedBox(height: 18),
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
            )
          else
            CardBox(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (var i = 0; i < _docs.length; i++) ...[
                    DocumentRow(
                      title: _docs[i].title,
                      size: _docs[i].size,
                      icon: _iconForDoc(_docs[i].title),
                      onOpen: () => _handleOpen(_docs[i]),
                      onDownload: () => _handleDownload(_docs[i]),
                    ),
                    if (i < _docs.length - 1)
                      const Divider(height: 1, indent: 70, endIndent: 16),
                  ],
                ],
              ),
            ),
        ],
      );
  }
}

