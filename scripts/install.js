const fs = require('fs');
const path = require('path');
const https = require('https');

const TOXIPROXY_VERSION = 'v2.11.0'; 
const BIN_PATH = path.join(__dirname, '..', 'bin');

const getPlatform = () => {
  switch (process.platform) {
    case 'darwin': return 'darwin';
    case 'linux': return 'linux';
    case 'win32': return 'windows';
    default:
      console.error(`Unsupported platform: ${process.platform}`);
      process.exit(1);
  }
};

const getArchitecture = (platform) => {
  const arch = process.arch;

  if (platform === 'darwin' && arch === 'arm64') return 'arm64';
  if (platform === 'darwin' && arch === 'x64') return 'amd64';

  switch (arch) {
    case 'x64': return 'amd64';
    case 'arm64': return 'arm64';
    case 'ia32': return '386';
    default:
      console.error(`Unsupported architecture: ${arch}`);
      process.exit(1);
  }
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    console.log(`Downloading from: ${url}`); 

    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    });

    request.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const install = async () => {
  const platform = getPlatform();
  const architecture = getArchitecture(platform);
  const ext = platform === 'windows' ? '.exe' : '';
  
  const binaryName = `toxiproxy-server-${platform}-${architecture}${ext}`;
  const downloadUrl = `https://github.com/Shopify/toxiproxy/releases/download/${TOXIPROXY_VERSION}/${binaryName}`;
  const finalPath = path.join(BIN_PATH, `toxiproxy-server${ext}`);

  console.log(`\nPughost Installer`);
  console.log(`††††††††††††††††††††††††`);
  console.log(`Detected: ${platform} (${process.arch})`);
  console.log(`Fetching engine: ${TOXIPROXY_VERSION}...`);
  
  if (!fs.existsSync(BIN_PATH)) {
    fs.mkdirSync(BIN_PATH, { recursive: true });
  }

  try {
    await downloadFile(downloadUrl, finalPath);
    console.log(`Download complete.`);
    
    if (platform !== 'windows') {
      fs.chmodSync(finalPath, '755');
      console.log(`Permissions set.`);
    }

    console.log(`Ready. Run 'pughost --help' to start.\n`);
  } catch (error) {
    console.error(`Installation failed: ${error.message}`);
    process.exit(1);
  }
};

install();