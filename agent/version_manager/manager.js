#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const RELEASE_DIR = process.env.AGENT_RELEASE_DIR || '/data/Intranet/negces/NegcesAgent/releases';
const MANIFEST_PATH = path.join(RELEASE_DIR, 'manifest.json');
const OBSIDIAN_TRACKING_PATH = '/home/aparichit/Desktop/ObsidianVaults/ProjectsAndResearch/ChinnaProjs/NegcesLab/Agent Binaries/Agent Binaries Version Tracking.md';

function getSHA256(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

function ensureReleaseDir() {
    if (!fs.existsSync(RELEASE_DIR)) {
        fs.mkdirSync(RELEASE_DIR, { recursive: true });
    }
}

function getManifest() {
    ensureReleaseDir();
    if (!fs.existsSync(MANIFEST_PATH)) {
        const defaultManifest = {
            latestVersion: "v1.5",
            minRequiredVersion: "v1.0",
            releaseDate: new Date().toISOString(),
            changelog: ["Initial version release management setup"],
            downloads: {
                windows: { version: "v1.5", executable: "NegcesLab.exe", installer: "NegcesLabSetup.exe", updater: "updater.exe" },
                linux: { version: "v1.5", executable: "NegcesLab", installer: "installer_linux.sh", updater: "updater" }
            }
        };
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(defaultManifest, null, 2));
        return defaultManifest;
    }
    try {
        return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch (e) {
        console.error('Error parsing manifest.json:', e.message);
        process.exit(1);
    }
}

function saveManifest(manifest) {
    ensureReleaseDir();
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated manifest at: ${MANIFEST_PATH}`);
}

function listVersions() {
    ensureReleaseDir();
    const manifest = getManifest();
    console.log(`\n======================================================`);
    console.log(` 📦 NEGCES AGENT SERVER RELEASE MANAGER`);
    console.log(` Release Root: ${RELEASE_DIR}`);
    console.log(` Active Version: ${manifest.latestVersion}`);
    console.log(`======================================================\n`);

    const entries = fs.readdirSync(RELEASE_DIR, { withFileTypes: true });
    const versions = entries.filter(e => e.isDirectory() && e.name.startsWith('v')).map(e => e.name);

    if (versions.length === 0) {
        console.log('No version directories found in releases.');
        return;
    }

    versions.forEach(v => {
        const isActive = v === manifest.latestVersion ? '🟢 (ACTIVE)' : '   ';
        const winExe = path.join(RELEASE_DIR, v, 'windows', 'NegcesLab.exe');
        const linExe = path.join(RELEASE_DIR, v, 'linux', 'NegcesLab');

        const winExists = fs.existsSync(winExe) ? 'Win: OK' : 'Win: MISSING';
        const linExists = fs.existsSync(linExe) ? 'Linux: OK' : 'Linux: MISSING';

        console.log(`${isActive} ${v.padEnd(10)} [${winExists} | ${linExists}]`);
    });
    console.log('');
}

function createVersion(version, changelogItems = []) {
    if (!version || !version.startsWith('v')) {
        console.error('❌ Version must start with "v" (e.g. v1.6)');
        process.exit(1);
    }

    const versionDir = path.join(RELEASE_DIR, version);
    const winDir = path.join(versionDir, 'windows');
    const linDir = path.join(versionDir, 'linux');

    fs.mkdirSync(winDir, { recursive: true });
    fs.mkdirSync(linDir, { recursive: true });
    console.log(`📁 Created directory structure: ${versionDir}`);

    const manifest = getManifest();
    manifest.latestVersion = version;
    manifest.releaseDate = new Date().toISOString();
    manifest.changelog = changelogItems.length > 0 ? changelogItems : [`Release ${version}`];

    manifest.downloads.windows.version = version;
    manifest.downloads.linux.version = version;

    saveManifest(manifest);
    console.log(`🎉 Version ${version} initialized and set to ACTIVE!`);
}

function setActiveVersion(version) {
    const versionDir = path.join(RELEASE_DIR, version);
    if (!fs.existsSync(versionDir)) {
        console.error(`❌ Version directory does not exist: ${versionDir}`);
        process.exit(1);
    }
    const manifest = getManifest();
    manifest.latestVersion = version;
    saveManifest(manifest);
    console.log(`🟢 Active release version changed to: ${version}`);
}

function showInfo() {
    const manifest = getManifest();
    console.log('\n--- Current Release Manifest ---');
    console.log(JSON.stringify(manifest, null, 2));
}

// Command Line Dispatcher
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
    case 'list':
    case 'ls':
        listVersions();
        break;
    case 'create':
    case 'new':
        const changelog = arg2 ? arg2.split(';').map(s => s.trim()) : [`Release ${arg1}`];
        createVersion(arg1, changelog);
        break;
    case 'set-active':
        setActiveVersion(arg1);
        break;
    case 'info':
        showInfo();
        break;
    default:
        console.log(`
Usage: node manager.js <command> [args]

Commands:
  list                        List all release versions and status
  create <version> [changelog] Create a new version directory & set active (e.g. create v1.6 "Feature X; Bug Y")
  set-active <version>         Set existing version as active release
  info                        Print current manifest.json details
        `);
        listVersions();
        break;
}
