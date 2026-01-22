#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOXIPROXY_API = 'http://localhost:8474';

const program = new Command();

program
  .name('pughost')
  .description('Localhost is a Lie. Test in Reality.')
  .version('0.0.1');

const getBinaryPath = () => {
  const platform = process.platform;
  const ext = platform === 'win32' ? '.exe' : '';
  const binPath = path.join(__dirname, 'bin', `toxiproxy-server${ext}`);
  
  if (!fs.existsSync(binPath)) {
    console.error(`Critical: Engine not found at ${binPath}`);
    console.error(`Run 'npm install' to fix.`);
    process.exit(1);
  }
  return binPath;
};

const waitForToxiproxy = async (retries = 10) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${TOXIPROXY_API}/version`);
      if (res.ok) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return false;
};

let proxyProcess = null;
const cleanup = () => {
  if (proxyProcess) {
    console.log('\nShutting Pughost down...');
    proxyProcess.kill();
    proxyProcess = null;
  }
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

program.command('init')
  .description('Generate configuration file')
  .action(() => {
    const configPath = path.join(process.cwd(), 'pughost.json');
    if (fs.existsSync(configPath)) {
      console.error('Error: pughost.json already exists.');
      process.exit(1);
    }
    const defaultConfig = {
      upstream: "localhost:3000",
      proxyPort: 3001,
      scenarios: {
        mobile_3g_slow: { latency: 1000, jitter: 500, bandwidth: 50 },
        wifi_cafe_crowded: { latency: 100, jitter: 800, packet_loss: 0.05 },
        satellite_link: { latency: 800, bandwidth: 1000 }
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('Created pughost.json');
  });

program.command('list')
  .description('List available scenarios')
  .action(() => {
    const configPath = path.join(process.cwd(), 'pughost.json');
    if (!fs.existsSync(configPath)) {
      console.error('No config found. Run "pughost init" first.');
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('\nAvailable Scenarios:');
    Object.keys(config.scenarios).forEach(key => {
      console.log(` - ${key}`);
    });
    console.log('');
  });

program.command('start')
  .description('Start the proxy with a scenario')
  .requiredOption('-s, --scenario <name>', 'Name of scenario')
  .action(async (options) => {
    const configPath = path.join(process.cwd(), 'pughost.json');
    if (!fs.existsSync(configPath)) {
      console.error('Error: pughost.json not found.');
      process.exit(1);
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const scenario = config.scenarios[options.scenario];

    if (!scenario) {
      console.error(`Error: Scenario "${options.scenario}" not found.`);
      process.exit(1);
    }

    console.log('pughost active...');
    const binPath = getBinaryPath();
    proxyProcess = spawn(binPath, [], { stdio: 'pipe' }); 
    
    proxyProcess.stderr.on('data', (data) => {
      if (data.toString().includes('address already in use')) {
        console.error('Error: Port 8474 is in use. Is Pughost already running?');
        cleanup();
      }
    });

    const ready = await waitForToxiproxy();
    if (!ready) {
      console.error('Error: Pughost failed to start.');
      cleanup();
    }

    try {
      await fetch(`${TOXIPROXY_API}/proxies/pughost`, { method: 'DELETE' }).catch(() => {});
      const createRes = await fetch(`${TOXIPROXY_API}/proxies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'pughost',
          listen: `localhost:${config.proxyPort}`,
          upstream: config.upstream,
          enabled: true
        })
      });

      if (!createRes.ok) throw new Error(`Failed to create proxy: ${createRes.statusText}`);

      console.log(`chaos config: ${options.scenario}`);
      
      const toxics = [];
      if (scenario.latency) toxics.push({ type: 'latency', attributes: { latency: scenario.latency, jitter: scenario.jitter || 0 } });
      if (scenario.bandwidth) toxics.push({ type: 'bandwidth', attributes: { rate: scenario.bandwidth } });
      if (scenario.packet_loss) toxics.push({ type: 'timeout', toxicity: scenario.packet_loss, attributes: { timeout: 0 } });

      for (const toxic of toxics) {
        toxic.stream = 'downstream'; 
        
        const res = await fetch(`${TOXIPROXY_API}/proxies/pughost/toxics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toxic)
        });
        
        if (!res.ok) {
           console.warn(`Failed to apply toxic ${toxic.type}: ${res.statusText}`);
        }
      }

      console.log('\nProxy Live:');
      console.log(`Target:   ${config.upstream}`);
      console.log(`Proxy:    http://localhost:${config.proxyPort}\n`);
      console.log('Press Ctrl+C to stop.\n');

    } catch (err) {
      console.error('Configuration Error:', err.message);
      cleanup();
    }
  });

program.parse(process.argv);