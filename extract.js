const TOTP_VAULT_GROUP = "xal.totpEntitiesVaultGroup";

Java.perform(function () {
    const VaultImpl = Java.use("android.cim.comcast.com.comcastmobilevault.impl.VaultImpl");
    const ActivityThread = Java.use("android.app.ActivityThread");
    const JavaString = Java.use("java.lang.String");

    function extractFromVault(vault) {
        try {
            const keys = vault.getAllKeys(TOTP_VAULT_GROUP);

            if (keys.size() === 0) {
                console.log("[-] No keys found in ", TOTP_VAULT_GROUP + ",", "is the app signed in?");
                return;
            }

            for (let i = 0; i < keys.size(); i++) {
                const key = keys.get(i).toString();
                console.log("[!] Found Key: " + key);

                const result = vault.read(TOTP_VAULT_GROUP, key);
                if (result !== null) {
                    const decryptedData = JavaString.$new(result);

                    try {
                        const jsonObject = JSON.parse(decryptedData);

                        if (jsonObject.secret) {
                            const BouncyBase64 = Java.use("org.bouncycastle.util.encoders.Base64");
                            const BouncyBase32 = Java.use("org.bouncycastle.util.encoders.Base32");
                            const StringClass = Java.use("java.lang.String");

                            /**
                             * Helper function to convert encoding results back to a string
                             */
                            function fromJavaBytes(bytes) {
                                return StringClass.$new(bytes, "UTF-8");
                            }

                            // Base64-decode the seed
                            const decodedSecret = BouncyBase64.decode(jsonObject.secret);

                            // Base32-encode the seed to be compatible with TOTP apps
                            const encodedSecret = BouncyBase32.encode(decodedSecret);
                            const secret = fromJavaBytes(encodedSecret);

                            console.log("\t[+] TOTP seed: " + secret);

                            // Assemble an otpauth:// URI
                            const otpAuthUri = [
                                "otpauth://totp/",
                                "Xfinity:",
                                key,
                                "?secret=",
                                secret,
                                "&issuer=Xfinity",
                                "&algorithm=SHA1",
                                "&digits=6",
                                "&period=30"
                            ].join("");
                            console.log("\t[+] TOTP URI: " + otpAuthUri);
                        }
                    } catch (e) { }
                }
            }
        } catch (err) {
            console.log("[!] Error during vault extraction: " + err);
        }
    }

    // Search the heap
    let instanceFound = false;
    console.log("[*] Searching heap for VaultImpl instances...");
    Java.choose("android.cim.comcast.com.comcastmobilevault.impl.VaultImpl", {
        onMatch: function (instance) {
            console.log("[+] VaultImpl instance found on the heap");
            instanceFound = true;

            extractFromVault(instance);
        },
        onComplete: function () {
            if (instanceFound) {
                console.log("[-] No VaultImpl instances found on heap. Attempting manual instantiation...");

                // Attempt to manually create an instance
                const context = ActivityThread.currentApplication().getApplicationContext();
                if (context) {
                    try {
                        console.log("[*] Creating new VaultImpl instance with App Context...");
                        const manualVault = VaultImpl.$new(context);

                        extractFromVault(manualVault);

                        // Mark the vault for later garbage collection
                        manualVault.$dispose();
                    } catch (e) {
                        console.log("[!] Manual instantiation failed: " + e);
                    }
                } else {
                    console.log("[!] Could not retrieve Application Context.");
                }
            }
        }
    });
});
