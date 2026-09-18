import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class DocumentRow extends StatelessWidget {
  const DocumentRow({
    super.key,
    required this.title,
    required this.size,
    required this.icon,
    required this.onOpen,
    required this.onDownload,
  });

  final String title, size;
  final IconData icon;
  final VoidCallback onOpen, onDownload;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 11, 10, 11),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.softGreen,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.deepGreen, size: 21),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'PDF  ·  $size',
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filledTonal(
                tooltip: 'Download $title',
                onPressed: onDownload,
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.softGreen,
                  foregroundColor: AppColors.deepGreen,
                  minimumSize: const Size(40, 40),
                  maximumSize: const Size(40, 40),
                ),
                icon: const Icon(Icons.download_rounded, size: 20),
              ),
            ],
          ),
        ),
      );
}
