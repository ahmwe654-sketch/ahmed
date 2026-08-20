import net from 'net';

export interface RconOptions {
  host: string;
  port: number;
  password?: string;
  timeoutMs?: number;
}

export interface RconExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

const SERVERDATA_RESPONSE_VALUE = 0;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_AUTH_RESPONSE = 2;
const SERVERDATA_AUTH = 3;

export class MinecraftRconClient {
  private host: string;
  private port: number;
  private password?: string;
  private timeoutMs: number;
  private socket: net.Socket | null = null;
  private requestId = 100;
  private authenticated = false;
  private connecting = false;
  private pendingRequests = new Map<number, { resolve: (val: string) => void; reject: (err: Error) => void; timeout: NodeJS.Timeout }>();
  private buffer = Buffer.alloc(0);

  constructor(options: RconOptions) {
    this.host = options.host || '127.0.0.1';
    this.port = options.port || 25575;
    this.password = options.password || '';
    this.timeoutMs = options.timeoutMs || 6000;
  }

  public updateConfig(host: string, port: number, password?: string) {
    if (this.host !== host || this.port !== port || (password !== undefined && this.password !== password)) {
      this.disconnect();
      this.host = host;
      this.port = port;
      if (password !== undefined) this.password = password;
    }
  }

  public isConnectedAndAuthenticated(): boolean {
    return !!this.socket && !this.socket.destroyed && this.authenticated;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnectedAndAuthenticated()) {
      return true;
    }

    if (!this.password) {
      throw new Error('RCON password is not configured. Set RCON_PASSWORD in .env or server settings.');
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      let attempts = 0;
      while (this.connecting && attempts < 20) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
        if (this.isConnectedAndAuthenticated()) return true;
      }
    }

    this.connecting = true;
    this.disconnect();

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      this.socket = socket;

      let authTimer: NodeJS.Timeout | null = setTimeout(() => {
        this.connecting = false;
        this.disconnect();
        reject(new Error(`RCON connection timed out to ${this.host}:${this.port}`));
      }, this.timeoutMs);

      socket.on('connect', () => {
        // Send Auth Packet
        const authReqId = ++this.requestId;
        const packet = this.createPacket(authReqId, SERVERDATA_AUTH, this.password || '');
        socket.write(packet);
      });

      socket.on('data', (data) => {
        this.buffer = Buffer.concat([this.buffer, data]);
        this.processIncomingPackets(authTimer, resolve, reject);
      });

      socket.on('error', (err: any) => {
        this.connecting = false;
        if (authTimer) {
          clearTimeout(authTimer);
          authTimer = null;
        }
        this.authenticated = false;
        const errMsg = err.code === 'ECONNREFUSED'
          ? `RCON connection refused at ${this.host}:${this.port}. Check if enable-rcon=true and rcon.port=${this.port} are set in server.properties.`
          : `RCON Network error: ${err.message || err.code}`;
        reject(new Error(errMsg));
      });

      socket.on('close', () => {
        this.connecting = false;
        this.authenticated = false;
        this.rejectAllPending(new Error('RCON socket closed unexpectedly'));
      });

      socket.connect(this.port, this.host);
    });
  }

  private processIncomingPackets(
    authTimer: NodeJS.Timeout | null,
    authResolve: (val: boolean) => void,
    authReject: (err: Error) => void
  ) {
    while (this.buffer.length >= 12) {
      const length = this.buffer.readInt32LE(0);
      const totalPacketSize = length + 4;

      if (this.buffer.length < totalPacketSize) {
        // Wait for more data
        break;
      }

      const packetBuffer = this.buffer.subarray(0, totalPacketSize);
      this.buffer = this.buffer.subarray(totalPacketSize);

      const id = packetBuffer.readInt32LE(4);
      const type = packetBuffer.readInt32LE(8);
      // Body starts at offset 12 up to totalPacketSize - 2 (strip double null terminators)
      const bodyBytes = packetBuffer.subarray(12, totalPacketSize - 2);
      const body = bodyBytes.toString('utf8');

      // Authentication Response handling
      if (!this.authenticated && (type === SERVERDATA_AUTH_RESPONSE || type === SERVERDATA_RESPONSE_VALUE)) {
        if (id === -1) {
          if (authTimer) clearTimeout(authTimer);
          this.connecting = false;
          this.authenticated = false;
          this.disconnect();
          authReject(new Error('RCON Authentication failed: Invalid RCON password.'));
          return;
        } else {
          if (authTimer) clearTimeout(authTimer);
          this.connecting = false;
          this.authenticated = true;
          authResolve(true);
          return;
        }
      }

      // Normal Command Response handling
      const pending = this.pendingRequests.get(id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(id);
        pending.resolve(body);
      }
    }
  }

  public async sendCommand(cmd: string): Promise<string> {
    if (!this.isConnectedAndAuthenticated()) {
      await this.connect();
    }

    if (!this.socket || this.socket.destroyed) {
      throw new Error('RCON is not connected');
    }

    const cleanCmd = cmd.startsWith('/') ? cmd.slice(1) : cmd;
    const reqId = ++this.requestId;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new Error(`RCON command timed out: "${cleanCmd}"`));
      }, this.timeoutMs);

      this.pendingRequests.set(reqId, { resolve, reject, timeout });

      try {
        const packet = this.createPacket(reqId, SERVERDATA_EXECCOMMAND, cleanCmd);
        this.socket!.write(packet);
      } catch (err: any) {
        this.pendingRequests.delete(reqId);
        clearTimeout(timeout);
        reject(new Error(`Failed to dispatch RCON packet: ${err.message}`));
      }
    });
  }

  private createPacket(id: number, type: number, body: string): Buffer {
    const bodyBuf = Buffer.from(body, 'utf8');
    const length = 4 + 4 + bodyBuf.length + 2; // id (4) + type (4) + body (N) + nulls (2)
    const buf = Buffer.alloc(length + 4);

    buf.writeInt32LE(length, 0);
    buf.writeInt32LE(id, 4);
    buf.writeInt32LE(type, 8);
    bodyBuf.copy(buf, 12);
    buf.writeInt8(0, 12 + bodyBuf.length);
    buf.writeInt8(0, 12 + bodyBuf.length + 1);

    return buf;
  }

  private rejectAllPending(err: Error) {
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(err);
    }
    this.pendingRequests.clear();
  }

  public disconnect() {
    this.authenticated = false;
    this.connecting = false;
    this.rejectAllPending(new Error('RCON client disconnected'));
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch {
        // cleanup
      }
      this.socket = null;
    }
    this.buffer = Buffer.alloc(0);
  }
}
