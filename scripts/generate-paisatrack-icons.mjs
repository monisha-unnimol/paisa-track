import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

const PRIMARY = '#0D9488';
const PRIMARY_DARK = '#0F766E';
const WHITE = '#FFFFFF';

function rupeeSvg(size) {
  const fontSize = Math.round(size * 0.46);
  const stroke = Math.round(size * 0.045);
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${PRIMARY}" />
          <stop offset="100%" stop-color="${PRIMARY_DARK}" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#bg)" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.34}" fill="${WHITE}" fill-opacity="0.14" />
      <text
        x="50%"
        y="54%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="${WHITE}"
        stroke="${PRIMARY_DARK}"
        stroke-width="${stroke}"
        paint-order="stroke fill"
      >₹</text>
    </svg>
  `;
}

function foregroundSvg(size) {
  const fontSize = Math.round(size * 0.34);
  const stroke = Math.round(size * 0.035);
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%"
        y="54%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="${WHITE}"
        stroke="${PRIMARY_DARK}"
        stroke-width="${stroke}"
        paint-order="stroke fill"
      >₹</text>
    </svg>
  `;
}

async function writeSvgPng(svg, outputPath, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outputPath);
}

const DENSITIES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const NOTIFICATION_DENSITIES = {
  'drawable-mdpi': 24,
  'drawable-hdpi': 36,
  'drawable-xhdpi': 48,
  'drawable-xxhdpi': 72,
  'drawable-xxxhdpi': 96,
};

const SPLASH_LOGO_DENSITIES = {
  'drawable-mdpi': 96,
  'drawable-hdpi': 144,
  'drawable-xhdpi': 192,
  'drawable-xxhdpi': 288,
  'drawable-xxxhdpi': 384,
};

async function writeWebp(svg, outputPath, size) {
  await sharp(Buffer.from(svg)).resize(size, size).webp().toFile(outputPath);
}

async function generateAndroidIcons(androidResDir) {
  for (const [folder, size] of Object.entries(DENSITIES)) {
    const dir = join(androidResDir, folder);
    await mkdir(dir, { recursive: true });
    await writeWebp(rupeeSvg(1024), join(dir, 'ic_launcher.webp'), size);
    await writeWebp(rupeeSvg(1024), join(dir, 'ic_launcher_round.webp'), size);
    await writeWebp(foregroundSvg(1024), join(dir, 'ic_launcher_foreground.webp'), size);
    await writeWebp(foregroundSvg(1024), join(dir, 'ic_launcher_monochrome.webp'), size);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: PRIMARY,
      },
    })
      .webp()
      .toFile(join(dir, 'ic_launcher_background.webp'));
  }

  for (const [folder, size] of Object.entries(NOTIFICATION_DENSITIES)) {
    const dir = join(androidResDir, folder);
    await mkdir(dir, { recursive: true });
    await sharp(Buffer.from(rupeeSvg(1024)))
      .resize(size, size)
      .png()
      .toFile(join(dir, 'notification_icon.png'));
  }

  for (const [folder, size] of Object.entries(SPLASH_LOGO_DENSITIES)) {
    const dir = join(androidResDir, folder);
    await mkdir(dir, { recursive: true });
    await sharp(Buffer.from(rupeeSvg(1024)))
      .resize(size, size)
      .png()
      .toFile(join(dir, 'splashscreen_logo.png'));
  }
}

async function main() {
  await mkdir(assetsDir, { recursive: true });

  await writeSvgPng(rupeeSvg(1024), join(assetsDir, 'icon.png'), 1024);
  await writeSvgPng(rupeeSvg(1024), join(assetsDir, 'splash-icon.png'), 1024);
  await writeSvgPng(foregroundSvg(1024), join(assetsDir, 'android-icon-foreground.png'), 1024);

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: PRIMARY,
    },
  })
    .png()
    .toFile(join(assetsDir, 'android-icon-background.png'));

  await writeSvgPng(foregroundSvg(1024), join(assetsDir, 'android-icon-monochrome.png'), 1024);
  await writeSvgPng(rupeeSvg(48), join(assetsDir, 'favicon.png'), 48);

  const androidResDir = join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
  await generateAndroidIcons(androidResDir);

  console.log('Generated PaisaTrack icons in assets/ and android/app/src/main/res/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
