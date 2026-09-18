import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/sub_page.dart';

class AgentDocumentsPage extends StatefulWidget {
  const AgentDocumentsPage({super.key, required this.customer});

  final String customer;

  @override
  State<AgentDocumentsPage> createState() => _AgentDocumentsPageState();
}

class _AgentDocumentsPageState extends State<AgentDocumentsPage> {
  final received = <int>{0, 1, 2};
  static const documents = [
    'Aadhaar card',
    'Latest electricity bill',
    'Property ownership proof',
    'Cancelled cheque',
    'Customer photograph',
  ];

  @override
  Widget build(BuildContext context) => SubPage(
        title: 'Collect documents',
        children: [
          Text(
            widget.customer,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          Text(
            '${received.length} of ${documents.length} documents received',
            style: const TextStyle(color: AppColors.muted),
          ),
          const SizedBox(height: 14),
          LinearProgressIndicator(
            value: received.length / documents.length,
            minHeight: 8,
            borderRadius: BorderRadius.circular(10),
            color: AppColors.green,
            backgroundColor: AppColors.softGreen,
          ),
          const SizedBox(height: 20),
          CardBox(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var i = 0; i < documents.length; i++) ...[
                  ListTile(
                    contentPadding: const EdgeInsets.fromLTRB(14, 5, 8, 5),
                    leading: CircleAvatar(
                      backgroundColor:
                          received.contains(i) ? AppColors.softGreen : AppColors.canvas,
                      child: Icon(
                        received.contains(i)
                            ? Icons.check_rounded
                            : Icons.description_outlined,
                        color:
                            received.contains(i) ? AppColors.green : AppColors.muted,
                      ),
                    ),
                    title: Text(
                      documents[i],
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle:
                        Text(received.contains(i) ? 'Received' : 'Pending'),
                    trailing: received.contains(i)
                        ? IconButton(
                            tooltip: 'View',
                            onPressed: () =>
                                _message('Opening ${documents[i]}…'),
                            icon: const Icon(Icons.visibility_outlined),
                          )
                        : TextButton(
                            onPressed: () {
                              setState(() => received.add(i));
                              _message('${documents[i]} uploaded');
                            },
                            child: const Text('Upload'),
                          ),
                  ),
                  if (i < documents.length - 1)
                    const Divider(height: 1, indent: 70, endIndent: 14),
                ],
              ],
            ),
          ),
        ],
      );

  void _message(String value) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(value)));
  }
}
