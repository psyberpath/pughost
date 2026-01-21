#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('pughost')
  .description('Localhost is a Lie. Test in Reality.')
  .version('0.0.1');

program.command('init')
  .description('Generate the default pughost.json configuration')
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
        mobile_3g_slow: {
          latency: 1000,
          jitter: 500,
          bandwidth: 50,
          packet_loss: 0.02
        },
        wifi_cafe_crowded: {
          latency: 100,
          jitter: 800,
          packet_loss: 0.05
        },
        satellite_link: {
            latency: 800,
            jitter: 50,
            bandwidth: 1000,
            packet_loss: 0.005
        }
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('Created pughost.json');
    console.log('Next: Run "pughost start --scenario mobile_3g_slow"');
  });

program.command('start')
  .description('Begin pughost')
  .argument('<scenario>', 'scenario to simulate')
  .options('--scenario')

program.parse(process.argv);