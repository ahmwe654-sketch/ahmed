import net from 'net';

export interface MCServerStatusResult {
  online: boolean;
  version?: {
    name: string;
    protocol: number;
  };
  players?: {
    max: number;
    online: number;
    sample?: Array<{ name: string; id: string }>;
  };
  description?: string;
  favicon?: string;
  pingMs?: number;
  error?: string;
}

// Helpers for VarInt encoding/decoding in Minecraft Protocol
function encodeVarInt(val: number): Buffer {
  const bytes: number[] = [];
  let value = val;
  while (true) {
    if ((value & ~0x7f) === 0) {
      bytes.push(value);
      return Buffer.from(bytes);
    }
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
}

function decodeVarInt(buffer: Buffer, offset = 0): { value: number; bytesRead: number } {
  let result = 0;
  let numRead = 0;
  let currentByte: number;

  do {
    if (offset + numRead >= buffer.length) {
      throw new Error('VarInt read exceeded buffer length');
    }
    currentByte = buffer[offset + numRead];
    const value = currentByte & 0b01111111;
    result |= value << (7 * numRead);

    numRead++;
    if (numRead > 5) {
      throw new Error('VarInt is too big');
    }
  } while ((currentByte & 0b10000000) !== 0);

  return { value: result, bytesRead: numRead };
}

function encodeString(str: string): Buffer {
  const strBuf = Buffer.from(str, 'utf8');
  const lenBuf = encodeVarInt(strBuf.length);
  return Buffer.concat([lenBuf, strBuf]);
}

/**
 * Perform Minecraft Server List Ping (SLP) to query genuine live server status and latency
 */
export async function pingMinecraftServer(
  host = '127.0.0.1',
  port = 25565,
  timeoutMs = 4000
): Promise<MCServerStatusResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let resolved = false;
    let rawData = Buffer.alloc(0);

    const finish = (result: MCServerStatusResult) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {
        // socket cleanup
      }
      resolve(result);
    };

    socket.setTimeout(timeoutMs);

    socket.on('timeout', () => {
      finish({
        online: false,
        error: `Connection timed out after ${timeoutMs}ms (${host}:${port})`
      });
    });

    socket.on('error', (err: any) => {
      finish({
        online: false,
        error: err.code === 'ECONNREFUSED'
          ? `Server offline / Connection refused at ${host}:${port}`
          : `Network error: ${err.message || err.code}`
      });
    });

    socket.connect(port, host, () => {
      try {
        // 1. Send Handshake Packet (ID: 0x00)
        // Protocol version: 765 (1.20.4) or -1 for generic query
        const protocolVersion = encodeVarInt(765);
        const hostBuf = encodeString(host);
        const portBuf = Buffer.alloc(2);
        portBuf.writeUInt16BE(port, 0);
        const nextState = encodeVarInt(1); // 1 = Status, 2 = Login

        const handshakeData = Buffer.concat([
          Buffer.from([0x00]), // Packet ID 0x00
          protocolVersion,
          hostBuf,
          portBuf,
          nextState
        ]);
        const handshakePacket = Buffer.concat([encodeVarInt(handshakeData.length), handshakeData]);

        // 2. Send Status Request Packet (ID: 0x00, Length: 1)
        const statusRequestPacket = Buffer.from([0x01, 0x00]);

        // Send handshake then request
        socket.write(handshakePacket);
        socket.write(statusRequestPacket);
      } catch (err: any) {
        finish({
          online: false,
          error: `Handshake creation error: ${err.message}`
        });
      }
    });

    socket.on('data', (chunk) => {
      rawData = Buffer.concat([rawData, chunk]);

      try {
        if (rawData.length < 5) return; // Wait for minimum header

        let offset = 0;
        const packetLength = decodeVarInt(rawData, offset);
        offset += packetLength.bytesRead;

        const packetId = decodeVarInt(rawData, offset);
        offset += packetId.bytesRead;

        if (packetId.value !== 0x00) {
          // Unexpected packet ID
          return;
        }

        const stringLength = decodeVarInt(rawData, offset);
        offset += stringLength.bytesRead;

        // Check if we have received the full JSON payload
        if (rawData.length >= offset + stringLength.value) {
          const jsonStr = rawData.toString('utf8', offset, offset + stringLength.value);
          const pingMs = Date.now() - startTime;
          const parsed = JSON.parse(jsonStr);

          // Extract MOTD text representation
          let motdText = 'A Minecraft Server';
          if (typeof parsed.description === 'string') {
            motdText = parsed.description;
          } else if (parsed.description?.text) {
            motdText = parsed.description.text;
            if (Array.isArray(parsed.description.extra)) {
              motdText += parsed.description.extra.map((e: any) => e.text || '').join('');
            }
          }

          finish({
            online: true,
            version: {
              name: parsed.version?.name || 'Unknown',
              protocol: parsed.version?.protocol || 0
            },
            players: {
              max: parsed.players?.max || 0,
              online: parsed.players?.online || 0,
              sample: parsed.players?.sample || []
            },
            description: motdText,
            favicon: parsed.favicon,
            pingMs
          });
        }
      } catch (err: any) {
        // Incomplete packet chunk, continue buffering
      }
    });
  });
}
