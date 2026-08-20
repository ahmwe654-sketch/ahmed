import fs from 'fs';
import path from 'path';

export interface ParsedLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CHAT';
  message: string;
  raw: string;
}

export class MinecraftLogWatcher {
  private logFilePath: string | null = null;
  private filePosition = 0;
  private watcher: fs.FSWatcher | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private logsBuffer: ParsedLogEntry[] = [];
  private maxBufferSize = 500;
  private onNewLogCallback?: (entry: ParsedLogEntry) => void;

  constructor(serverDir?: string) {
    if (serverDir) {
      this.setServerDir(serverDir);
    }
  }

  public setServerDir(serverDir: string) {
    const targetPath = path.resolve(serverDir, 'logs', 'latest.log');
    if (this.logFilePath === targetPath) return;

    this.stopWatching();
    this.logFilePath = targetPath;
    this.startWatching();
  }

  public onNewLog(cb: (entry: ParsedLogEntry) => void) {
    this.onNewLogCallback = cb;
  }

  public getLogs(): ParsedLogEntry[] {
    return [...this.logsBuffer];
  }

  public clearLogs() {
    this.logsBuffer = [];
  }

  public addLog(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CHAT' = 'INFO') {
    const entry: ParsedLogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      raw: message
    };
    this.pushLog(entry);
  }

  private pushLog(entry: ParsedLogEntry) {
    this.logsBuffer.push(entry);
    if (this.logsBuffer.length > this.maxBufferSize) {
      this.logsBuffer.shift();
    }
    if (this.onNewLogCallback) {
      try {
        this.onNewLogCallback(entry);
      } catch {
        // ignore callback error
      }
    }
  }

  private startWatching() {
    if (!this.logFilePath) return;

    // Read existing file content if available
    try {
      if (fs.existsSync(this.logFilePath)) {
        const stats = fs.statSync(this.logFilePath);
        const readSize = Math.min(stats.size, 64 * 1024); // Read up to last 64KB on startup
        const startOffset = Math.max(0, stats.size - readSize);

        const fd = fs.openSync(this.logFilePath, 'r');
        const buffer = Buffer.alloc(readSize);
        fs.readSync(fd, buffer, 0, readSize, startOffset);
        fs.closeSync(fd);

        this.filePosition = stats.size;
        const initialText = buffer.toString('utf8');
        const lines = initialText.split(/\r?\n/).filter(Boolean);

        // Parse last 100 lines on load
        for (const line of lines.slice(-100)) {
          this.pushLog(this.parseLine(line));
        }
      }
    } catch (err) {
      console.warn(`[LogWatcher] Initial log read note:`, err);
    }

    // Set up polling watcher for resilient cross-platform log trailing
    this.pollInterval = setInterval(() => {
      this.checkFileForUpdates();
    }, 1000);
  }

  private checkFileForUpdates() {
    if (!this.logFilePath) return;

    try {
      if (!fs.existsSync(this.logFilePath)) {
        return;
      }

      const stats = fs.statSync(this.logFilePath);
      if (stats.size < this.filePosition) {
        // File was truncated or rotated
        this.filePosition = 0;
      }

      if (stats.size > this.filePosition) {
        const bytesToRead = stats.size - this.filePosition;
        const buffer = Buffer.alloc(bytesToRead);
        const fd = fs.openSync(this.logFilePath, 'r');
        fs.readSync(fd, buffer, 0, bytesToRead, this.filePosition);
        fs.closeSync(fd);

        this.filePosition = stats.size;
        const newText = buffer.toString('utf8');
        const lines = newText.split(/\r?\n/).filter(Boolean);

        for (const line of lines) {
          this.pushLog(this.parseLine(line));
        }
      }
    } catch {
      // Ignored non-fatal file read error during active server write
    }
  }

  public parseLine(line: string): ParsedLogEntry {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let timestamp = new Date().toLocaleTimeString();
    let level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CHAT' = 'INFO';
    let message = line;

    // Minecraft log format: [HH:MM:SS] [Server thread/INFO]: Message
    const mcLogMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s+\[([^/]+)\/([A-Z]+)\]:\s+(.*)$/);
    if (mcLogMatch) {
      timestamp = mcLogMatch[1];
      const parsedLevel = mcLogMatch[3];
      message = mcLogMatch[4];

      if (parsedLevel === 'WARN') level = 'WARN';
      else if (parsedLevel === 'ERROR' || parsedLevel === 'FATAL') level = 'ERROR';
      else if (message.includes('Done (') && message.includes(')! For help, type "help"')) level = 'SUCCESS';
      else if (/^<[^>]+>/.test(message) || message.startsWith('[Server]')) level = 'CHAT';
      else level = 'INFO';
    } else {
      // Fallback
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
        level = 'ERROR';
      } else if (line.toLowerCase().includes('warn')) {
        level = 'WARN';
      }
    }

    return {
      id,
      timestamp,
      level,
      message,
      raw: line
    };
  }

  public stopWatching() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
