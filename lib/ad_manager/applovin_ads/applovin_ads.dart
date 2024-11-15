import 'package:applovin_max/applovin_max.dart';
import 'package:flutter/material.dart';
import 'package:puzzle/ad_manager/ad_ids.dart';

abstract class AppLovinInterstitialAd {

  static void load() {
    try {
      AppLovinMAX.loadInterstitial(AdIds.interstitital);
    } catch (_) {}
  }

  static Future<void> show() async {
    if ((await AppLovinMAX.isInterstitialReady(AdIds.interstitital)) == true) {
      try {
        AppLovinMAX.showInterstitial(AdIds.interstitital);
        Future.delayed(const Duration(seconds: 10), () {
          load();
        });
      } catch (_) {}
    } else {
      load();
    }
  }
}

class AppLovinNativeAdWidget extends StatelessWidget {
  const AppLovinNativeAdWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaxAdView(
      adUnitId:AdIds.native,
      adFormat: AdFormat.mrec,
      listener: AdViewAdListener(
        onAdLoadedCallback: (ad) {},
        onAdLoadFailedCallback: (adUnitId, error) {},
        onAdClickedCallback: (ad) {},
        onAdExpandedCallback: (ad) {},
        onAdCollapsedCallback: (ad) {},
      ),
    );
  }
}

class AppLovinBannerAdWidget extends StatelessWidget {
  const AppLovinBannerAdWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaxAdView(
      adUnitId: AdIds.banner,
      adFormat: AdFormat.banner,
      listener: AdViewAdListener(
        onAdLoadedCallback: (ad) {},
        onAdLoadFailedCallback: (adUnitId, error) {},
        onAdClickedCallback: (ad) {},
        onAdExpandedCallback: (ad) {},
        onAdCollapsedCallback: (ad) {},
      ),
    );
  }
}
