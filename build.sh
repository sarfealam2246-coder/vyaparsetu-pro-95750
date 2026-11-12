#!/bin/bash
set -e
git clone --depth 1 https://github.com/xchacha20-poly1305/webview-apk-template.git android-shell
cd android-shell
mkdir -p app/src/main/assets
cp ../index.html app/src/main/assets/index.html
[ -f "../style.css" ] && cp ../style.css app/src/main/assets/style.css
[ -f "../db.js" ] && cp ../db.js app/src/main/assets/db.js
[ -f "../components.js" ] && cp ../components.js app/src/main/assets/components.js
[ -f "../app.js" ] && cp ../app.js app/src/main/assets/app.js
echo "app.url=file:///android_asset/index.html" > app.properties
echo "app.package=com.sarfealam.vyaparsetupro" >> app.properties
echo "app.name=VyaparSetu Pro" >> app.properties
if [ -f "../icon.svg" ]; then
  cp ../icon.svg icon.svg
  echo "app.icon_url=icon.svg" >> app.properties
else
  echo "app.icon_url=https://cdn-icons-png.flaticon.com/512/3135/3135715.png" >> app.properties
fi
chmod +x gradlew
./gradlew assembleDebug --no-daemon
mkdir -p ../dist
cp app/build/outputs/apk/debug/*.apk ../dist/vyaparsetupro_signed.apk
ls -lh ../dist/
