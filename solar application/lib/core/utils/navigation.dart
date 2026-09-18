import 'package:flutter/material.dart';

Future<T?> openPage<T>(BuildContext context, Widget page) =>
    Navigator.push<T>(context, MaterialPageRoute(builder: (_) => page));
