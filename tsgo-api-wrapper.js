import { API } from '@typescript/native-preview/async';
import { createVirtualFileSystem } from '@typescript/native-preview/fs';
import * as path from 'path';
import * as fs from 'fs';

async function run() {
  const vfs = createVirtualFileSystem({
    'src/foo.ts': fs.readFileSync(path.resolve(process.cwd(), 'src/foo.ts'), 'utf-8'),
    'src/generated/bar.ts': fs.readFileSync(path.resolve(process.cwd(), 'src/generated/bar.ts'), 'utf-8'),
  });
  
  // Intercept src/bar.ts to pretend it doesn't exist
  const originalReadFile = vfs.readFile;
  vfs.readFile = (filePath) => {
    const relativePath = path.relative(process.cwd(), filePath);
    if (relativePath === 'src/bar.ts') {
      console.log(`[Wrapper] Pretending ${relativePath} does not exist`);
      return null; // Absence
    }
    return originalReadFile ? originalReadFile(filePath) : undefined;
  };

  const api = new API({
    tsserverPath: './node_modules/.bin/tsgo',
    cwd: process.cwd(),
    fs: vfs
  });

  try {
    console.log('Connecting to TSGo server...');
    // API class handles connect implicitly in apiRequest
    console.log('Sending initial request to open project...');
    const response = await api.updateSnapshot({
      openProject: path.resolve(process.cwd(), 'tsconfig.json')
    });
    console.log('Response received:', response);

    const project = response.getProject(path.resolve(process.cwd(), 'tsconfig.json'));
    if (!project) {
      throw new Error('Project not found in snapshot');
    }

    const program = project.program;
    const sourceFile = await program.getSourceFile('src/foo.ts');
    if (!sourceFile) {
      throw new Error('Source file src/foo.ts not found');
    }

    console.log('Generating code for src/foo.ts...');
    const code = await project.emitter.printNode(sourceFile);
    console.log('Generated code:', code);

    const distDir = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }
    fs.writeFileSync(path.resolve(distDir, 'foo.js'), code);
    console.log('Emitted dist/foo.js');

  } catch (e) {
    console.error('Error running wrapper:', e);
  } finally {
    console.log('Closing API...');
    await api.close();
  }
}

run();
