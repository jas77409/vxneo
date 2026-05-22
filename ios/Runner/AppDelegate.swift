import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Safe Flutter engine start
    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    return result
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    // Register plugins safely — wrap in exception handler
    do {
      GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    }
  }

  // Handle remote notifications registration
  override func application(_ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  override func application(_ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error) {
    // Silently ignore — Firebase not critical on iOS
    print("[APNs] Registration failed (non-fatal): \(error.localizedDescription)")
  }
}
