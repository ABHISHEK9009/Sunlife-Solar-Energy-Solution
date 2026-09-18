import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_colors.dart';

class Logo extends StatelessWidget {
  const Logo({super.key});

  @override
  Widget build(BuildContext context) => Semantics(
        label: 'Sunlife Solar Energy Solution',
        image: true,
        child: SvgPicture.asset(
          'logo/logo.svg',
          width: 290,
          height: 100,
          fit: BoxFit.contain,
          alignment: Alignment.centerLeft,
          errorBuilder: (context, error, stackTrace) => const _LogoFallback(),
        ),
      );
}

class _LogoFallback extends StatelessWidget {
  const _LogoFallback();

  @override
  Widget build(BuildContext context) => const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.solar_power_rounded, color: AppColors.orange, size: 46),
          SizedBox(width: 10),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'SUNLIFE SOLAR',
                style: TextStyle(
                  color: AppColors.orange,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'ENERGY SOLUTION',
                style: TextStyle(
                  color: AppColors.deepGreen,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ],
      );
}
