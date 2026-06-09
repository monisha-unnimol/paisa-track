#!/usr/bin/env node
/**
 * Prepares the local environment for iOS native builds.
 * Patches React Native's strict Xcode version gate when using Xcode 15.x locally.
 *
 * Usage:
 *   node scripts/prepare-ios-native.js            # patch only
 *   node scripts/prepare-ios-native.js --prebuild # patch + generate ios/ if missing
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const shouldPrebuild = process.argv.includes('--prebuild');

const helpersPath = path.join(
  __dirname,
  '../node_modules/react-native/scripts/cocoapods/helpers.rb',
);

function patchXcodeVersionCheck() {
  if (!fs.existsSync(helpersPath)) {
    return;
  }

  const content = fs.readFileSync(helpersPath, 'utf8');
  const patched = content.replace(/return '16\.1'/, "return '15.2'");

  if (content !== patched) {
    fs.writeFileSync(helpersPath, patched);
    console.log('[ios] Adjusted React Native minimum Xcode version for local builds.');
  }
}

function ensureIosProject() {
  const iosDir = path.join(__dirname, '../ios');
  if (fs.existsSync(path.join(iosDir, 'Podfile'))) {
    return;
  }

  console.log('[ios] Native project missing. Running expo prebuild --platform ios...');
  execSync('npx expo prebuild --platform ios --no-install', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
}

function installPods() {
  const iosDir = path.join(__dirname, '../ios');
  if (!fs.existsSync(path.join(iosDir, 'Podfile'))) {
    return;
  }

  console.log('[ios] Running pod install...');
  execSync('pod install', {
    cwd: iosDir,
    stdio: 'inherit',
  });
}

patchXcodeVersionCheck();

if (shouldPrebuild) {
  ensureIosProject();
  installPods();
}
