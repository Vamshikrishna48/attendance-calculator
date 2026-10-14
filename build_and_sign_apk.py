import os
import zipfile
import subprocess
import shutil

BASE_DIR = r"c:\Users\karsh\Downloads\attendance_pred (last final)"
SRC_APK = os.path.join(BASE_DIR, "Attendance_Predictor.apk")
TARGET_APKS = [
    os.path.join(BASE_DIR, "Attendance_Predictor.apk"),
    os.path.join(BASE_DIR, "android_app", "app", "build", "outputs", "apk", "debug", "app-debug.apk")
]
ASSETS_DIR = os.path.join(BASE_DIR, "android_app", "app", "src", "main", "assets")
SDK_BUILD_TOOLS = r"C:\Users\karsh\AppData\Local\Android\Sdk\build-tools\34.0.0"
ZIPALIGN = os.path.join(SDK_BUILD_TOOLS, "zipalign.exe")
APKSIGNER = os.path.join(SDK_BUILD_TOOLS, "apksigner.bat")
DEBUG_KEYSTORE = r"C:\Users\karsh\.android\debug.keystore"

temp_unaligned = os.path.join(BASE_DIR, "temp_unaligned.apk")
temp_aligned = os.path.join(BASE_DIR, "temp_aligned.apk")

print(f"Reading base APK from: {SRC_APK}")
asset_files = {
    "assets/index.html": os.path.join(ASSETS_DIR, "index.html"),
    "assets/style.css": os.path.join(ASSETS_DIR, "style.css"),
    "assets/admin.js": os.path.join(ASSETS_DIR, "admin.js"),
    "assets/admin.html": os.path.join(ASSETS_DIR, "admin.html"),
    "assets/data_store.json": os.path.join(ASSETS_DIR, "data_store.json")
}

with zipfile.ZipFile(SRC_APK, 'r') as zin, zipfile.ZipFile(temp_unaligned, 'w') as zout:
    for item in zin.infolist():
        # Strip old signatures so apksigner can cleanly re-sign
        if item.filename.startswith("META-INF/") and (item.filename.endswith(".SF") or item.filename.endswith(".RSA") or item.filename.endswith(".DSA") or item.filename.endswith("MANIFEST.MF")):
            continue
        if item.filename in asset_files:
            local_path = asset_files[item.filename]
            print(f"Updating {item.filename} with {local_path} ({os.path.getsize(local_path)} bytes)")
            with open(local_path, "rb") as f:
                data = f.read()
            zout.writestr(item.filename, data)
        else:
            data = zin.read(item.filename)
            zout.writestr(item, data)

print("Unaligned APK created successfully.")

if os.path.exists(temp_aligned):
    os.remove(temp_aligned)

print(f"Running zipalign...")
res = subprocess.run([ZIPALIGN, "-f", "-p", "4", temp_unaligned, temp_aligned], capture_output=True, text=True)
if res.returncode != 0:
    print("Zipalign error:", res.stderr)
    raise SystemExit(1)
print("Zipalign completed.")

print(f"Running apksigner with keystore: {DEBUG_KEYSTORE}...")
res = subprocess.run([
    APKSIGNER, "sign",
    "--ks", DEBUG_KEYSTORE,
    "--ks-pass", "pass:android",
    "--key-pass", "pass:android",
    temp_aligned
], capture_output=True, text=True)
if res.returncode != 0:
    print("Apksigner error:", res.stderr)
    raise SystemExit(1)
print("Apksigner signing completed.")

print("Verifying signed APK...")
res = subprocess.run([APKSIGNER, "verify", "--verbose", temp_aligned], capture_output=True, text=True)
print("Verify output:", res.stdout)

for target in TARGET_APKS:
    os.makedirs(os.path.dirname(target), exist_ok=True)
    shutil.copy2(temp_aligned, target)
    print(f"Saved signed APK to: {target} ({os.path.getsize(target)} bytes)")

if os.path.exists(temp_unaligned):
    os.remove(temp_unaligned)
if os.path.exists(temp_aligned):
    os.remove(temp_aligned)

print("Done! APK is updated and ready to install on Android device.")
