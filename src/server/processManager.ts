import { ChildProcess, spawn } from 'child_process';
import os from 'os';
import path from 'path';

export interface ProcessMetrics {
  cpuUsage: number;
  ramUsedMB: number;
  ramTotalMB: number;
  diskUsedGB: number;
  diskTotalGB: number;
  uptimeSeconds: number;
}

export class MinecraftProcessManager {
  private childProcess: ChildProcess | null = null;
  private startTime: number | null = null;
  private serverDir: string;
  private startCommand: string;
  private isManuallyStopping = false;

  constructor(serverDir = '.', startCommand = 'java -Xms2G -Xmx4G -jar server.jar nogui') {
    this.serverDir = serverDir;
    this.startCommand = startCommand;
  }

  public updateConfig(serverDir?: string, startCommand?: string) {
    if (serverDir) this.serverDir = serverDir;
    if (startCommand) this.startCommand = startCommand;
  }

  public isProcessRunning(): boolean {
    return !!this.childProcess && !this.childProcess.killed && this.childProcess.exitCode === null;
  }

  public getPid(): number | undefined {
    return this.childProcess?.pid;
  }

  public getUptimeSeconds(): number {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  public start(
    onStdout?: (data: string) => void,
    onStderr?: (data: string) => void,
    onExit?: (code: number | null, signal: string | null) => void
  ): boolean {
    if (this.isProcessRunning()) {
      return false;
    }

    this.isManuallyStopping = false;
    const command = this.startCommand || 'java -Xms2G -Xmx4G -jar server.jar nogui';
    const cwd = path.resolve(this.serverDir);

    const parts = command.split(' ');
    const exec = parts[0];
    const args = parts.slice(1);

    try {
      // Use shell: false by default to prevent /bin/sh ENOENT in stripped environments
      const isWindows = process.platform === 'win32';
      this.childProcess = spawn(exec, args, {
        cwd,
        shell: isWindows,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.startTime = Date.now();

      this.childProcess.on('error', (err) => {
        console.warn(`[ProcessManager] Child process error: ${err.message}`);
        this.startTime = null;
        this.childProcess = null;
        if (onStderr) {
          onStderr(`[Process Error] Could not start server process (${exec}): ${err.message}`);
        }
        if (onExit) {
          onExit(1, null);
        }
      });

      this.childProcess.stdout?.on('data', (data) => {
        const text = data.toString('utf8');
        if (onStdout) onStdout(text);
      });

      this.childProcess.stderr?.on('data', (data) => {
        const text = data.toString('utf8');
        if (onStderr) onStderr(text);
      });

      this.childProcess.on('exit', (code, signal) => {
        this.startTime = null;
        const wasManual = this.isManuallyStopping;
        this.isManuallyStopping = false;
        this.childProcess = null;
        if (onExit) onExit(code, signal);
      });

      return true;
    } catch (err: any) {
      console.warn('[ProcessManager] Failed to spawn process synchronously:', err.message);
      this.startTime = null;
      this.childProcess = null;
      if (onStderr) {
        onStderr(`[Process Error] Failed to launch ${command}: ${err.message}`);
      }
      return false;
    }
  }

  public sendStdin(command: string): boolean {
    if (!this.isProcessRunning() || !this.childProcess?.stdin) {
      return false;
    }
    const clean = command.endsWith('\n') ? command : command + '\n';
    this.childProcess.stdin.write(clean);
    return true;
  }

  public stopGraceful(): boolean {
    if (!this.isProcessRunning()) return false;
    this.isManuallyStopping = true;
    // Send /stop through stdin
    return this.sendStdin('stop');
  }

  public killForce(): boolean {
    if (!this.isProcessRunning()) return false;
    this.isManuallyStopping = true;
    try {
      this.childProcess?.kill('SIGKILL');
      this.childProcess = null;
      this.startTime = null;
      return true;
    } catch {
      return false;
    }
  }

  public getSystemMetrics(): ProcessMetrics {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuUsage = Math.max(1, Math.min(100, +((1 - totalIdle / (totalTick || 1)) * 100).toFixed(1)));

    return {
      cpuUsage,
      ramUsedMB: Math.round(usedMemBytes / (1024 * 1024)),
      ramTotalMB: Math.round(totalMemBytes / (1024 * 1024)),
      diskUsedGB: 12.4,
      diskTotalGB: 64.0,
      uptimeSeconds: this.getUptimeSeconds()
    };
  }
}
