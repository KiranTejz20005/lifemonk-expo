/**
 * Run Android build with Java 21 (Android Studio JBR) to avoid
 * "restricted method in java.lang.System" errors when using Java 25+.
 */
const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const jbrPaths = isWindows
  ? [
      process.env.LOCALAPPDATA + '\\Programs\\Android Studio\\jbr',
      'C:\\Program Files\\Android\\Android Studio\\jbr',
    ]
  : [
      process.env.HOME + '/Library/Java/JavaVirtualMachines/android-studio/jbr/Contents/Home',
      '/opt/android-studio/jbr',
    ];

let javaHome = process.env.JAVA_HOME;
if (!javaHome) {
  const fs = require('fs');
  for (const p of jbrPaths) {
    if (p && fs.existsSync(p)) {
      javaHome = p;
      break;
    }
  }
}

if (javaHome) {
  process.env.JAVA_HOME = javaHome;
  console.log('[run-android-j21] Using JAVA_HOME:', javaHome);
} else {
  console.warn('[run-android-j21] No Java 21 JBR found; using default JAVA_HOME. If the build fails with "restricted method", install Android Studio or set JAVA_HOME to JDK 17 or 21.');
}

const child = spawn('npx', ['expo', 'run:android'], {
  stdio: 'inherit',
  shell: isWindows,
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, JAVA_HOME: javaHome || process.env.JAVA_HOME },
});
child.on('exit', (code) => process.exit(code ?? 0));
