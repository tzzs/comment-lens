import { resolve } from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  const extensionDevelopmentPath = resolve(__dirname, '../../..');
  const extensionTestsPath = resolve(__dirname, './suite/index');
  const fixtureWorkspacePath = resolve(extensionDevelopmentPath, 'test/integration/fixtures/workspace');

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [fixtureWorkspacePath]
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
