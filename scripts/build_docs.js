import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const files = [
  'README.md',
  'docs/ONBOARDING.md',
  'DESIGN_SYSTEM.md',
  'docs/ARCHITECTURE.md',
  'docs/DIEGETIC_PUZZLE_BIBLE.md',
  'docs/THE_CURE_DESIGN_BIBLE.md',
  'docs/PSYCHOLOGICAL_FRAMEWORK.md',
  'docs/PHASED_IMPLEMENTATION_PLAN.md'
];


let doc = '# THE VAULT: MASTER DOCUMENTATION\n\n*This document is an automated compilation of all technical, architectural, and design documentation for The Vault project.*\n\n---\n\n';

for (const rel of files) {
  const content = fs.readFileSync(path.join(rootDir, rel), 'utf8');
  doc += content + '\n\n---\n\n';
}

fs.writeFileSync(path.join(rootDir, 'THE_VAULT_DOCUMENTATION.md'), doc, 'utf8');

const htmlBody = marked.parse(doc);
const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>The Vault - Master Documentation</title>
<style>
  body { font-family: sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 40px 60px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; color: #24292f; }
  h1, h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
  pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
  code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 85%; }
  blockquote { margin: 0; padding: 0 1em; color: #57606a; border-left: 0.25em solid #d0d7de; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  table th, table td { border: 1px solid #d0d7de; padding: 6px 13px; }
  table tr:nth-child(2n) { background-color: #f6f8fa; }
  @media print { body { box-shadow: none; margin: 0; padding: 0; max-width: none; } #print-btn { display: none; } }
</style>
</head>
<body>
<button id="print-btn" style="position: fixed; top: 20px; right: 20px; padding: 10px 15px; background: #0969da; color: #fff; border: none; border-radius: 6px; cursor: pointer;" onclick="window.print()">Print to PDF</button>
${htmlBody}
</body>
</html>
`;

fs.writeFileSync(path.join(rootDir, 'THE_VAULT_DOCUMENTATION.html'), fullHtml, 'utf8');
console.log('Successfully compiled master documentation (MD & HTML).');
