#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const replacements = [
  {
    pattern: /from ['"]@\/context\/WalletContext['"]/g,
    replacement: "from '@/hooks/useWallet'",
    importName: 'useWallet',
  },
  {
    pattern: /from ['"]@\/context\/ThemeContext['"]/g,
    replacement: "from '@/hooks/useTheme'",
    importName: 'useTheme',
  },
  {
    pattern: /from ['"]@\/context\/NotificationContext['"]/g,
    replacement: "from '@/hooks/useNotifications'",
    importName: 'useNotifications',
  },
  {
    pattern: /from ['"]@\/context\/ModalContext['"]/g,
    replacement: "from '@/hooks/useModal'",
    importName: 'useModal',
  },
];

function processFile(filepath) {
  try {
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`✓ Updated: ${filepath}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filepath}: ${err.message}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        walk(filepath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filepath);
    }
  });
}

const srcDir = path.join(__dirname, '..', 'src');
console.log(`Migrating imports in: ${srcDir}\n`);
walk(srcDir);
console.log('\n✓ Migration complete!\nRemove old context files when ready.');
