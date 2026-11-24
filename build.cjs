const esbuild = require('esbuild');
const fs = require('fs');
const { execSync } = require('child_process');

async function build() {
  console.log('1. Type checking with tsc...');
  execSync('npx tsc -b', { stdio: 'inherit' });

  console.log('2. Building CSS with Tailwind CSS v4 CLI...');
  if (!fs.existsSync('dist/assets')) {
    fs.mkdirSync('dist/assets', { recursive: true });
  }
  execSync('npx @tailwindcss/cli -i src/index.css -o dist/assets/app.css --minify', { stdio: 'inherit' });

  console.log('3. Bundling JS/TSX with esbuild...');
  await esbuild.build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    outfile: 'dist/assets/app.js',
    minify: true,
    sourcemap: true,
    external: ['*.css'],
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.svg': 'dataurl',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  console.log('4. Generating production index.html...');
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace(
    '</head>',
    '  <link rel="stylesheet" href="./assets/app.css">\n  </head>'
  );
  html = html.replace('/src/main.tsx', './assets/app.js');
  fs.writeFileSync('dist/index.html', html, 'utf8');

  console.log('✅ Build successful! All artifacts created in dist/');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
