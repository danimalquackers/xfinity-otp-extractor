# Xfinity OTP Extractor

This Frida script extracts the stored OTP seed from the Xfinity Android application's "Code Generator". It achieves this by hooking into the `VaultImpl` class within the application and extracting the encoded secret from the keystore. The resulting seed value can be used in any TOTP authenticator such as Google Authenticator, Bitwarden, or Authy.

## High-Level Overview

The script performs the following steps:

1. **Targeting:** It searches the Android heap for active instances of `android.cim.comcast.com.comcastmobilevault.impl.VaultImpl`.
2. **Fallback Instantiation:** If no instance is found on the heap, it attempts to manually instantiate `VaultImpl` using the application context.
3. **Extraction:** Once an instance is acquired, it probes the `xal.totpEntitiesVaultGroup` for stored keys.
4. **Processing:** For each key found, it reads the encrypted JSON data, decrypts it using the app's native vault logic, and extracts the `secret` field.
5. **Encoding/Decoding:** It uses BouncyCastle's `Base64` and `Base32` classes (found in the app's own libraries) to process the extracted secret into a standard format usable by TOTP authenticators.

## Requirements

- **Device:** A rooted Android device or an environment where you have sufficient permissions to run Frida, such as a patched Xfinity app containing a Frida gadget.
- **Frida:** Ensure `frida-server` or `frida-gadget` is running on the device.
- **Dependencies:** This script is designed to be run via `frida` and assumes the target Xfinity APK is installed and running on the device.
- **Xfinity App:** Must be logged in to your Xfinity account and have "Two-step verification" and the "Code Generator" enabled in the settings.

## Usage

1. Start the Xfinity app on the target device and make sure you are logged in.
2. Ensure `frida-server` is running as root on the device.
3. Execute the script using Frida:

```bash
frida -U -p $(adb shell pidof com.comcast.mobile.xfinity) -l extract.js
```
