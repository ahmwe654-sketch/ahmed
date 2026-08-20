export interface McSrvStatResponse {
  online: boolean;
  ip?: string;
  port?: number;
  hostname?: string;
  version?: string;
  software?: string;
  eula_blocked?: boolean;
  motd?: {
    raw?: string[];
    clean?: string[];
    html?: string[];
  };
  players?: {
    online: number;
    max: number;
    list?: Array<{
      name: string;
      uuid: string;
    }>;
  };
  icon?: string;
}

export interface LiveServerFetchResult {
  success: boolean;
  online: boolean;
  ip: string;
  port: number;
  motd: string;
  version: string;
  software: string;
  playersOnline: number;
  maxPlayers: number;
  playerList: Array<{ username: string; uuid: string }>;
  icon?: string;
  ping: number;
  errorMessage?: string;
}

function getPlayerUuid(name: string, explicitUuid?: string): string {
  if (explicitUuid && explicitUuid.length > 5) return explicitUuid;
  return `uuid-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

/**
 * Fetch real-time status of any Minecraft Java Server using public query APIs (with fallback)
 */
export async function queryRealMinecraftServer(
  host: string,
  port: number = 25565
): Promise<LiveServerFetchResult> {
  const cleanHost = host.trim().replace(/^https?:\/\//, '').split('/')[0];
  const queryHost = `${cleanHost}${port && port !== 25565 ? `:${port}` : ''}`;
  const startTime = Date.now();

  // Try Primary API (mcsrvstat.us)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://api.mcsrvstat.us/3/${queryHost}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const elapsedPing = Date.now() - startTime;

    if (response.ok) {
      const data: McSrvStatResponse = await response.json();

      if (data.online) {
        let motdClean = 'A Minecraft Java Server';
        if (data.motd?.clean && data.motd.clean.length > 0) {
          motdClean = data.motd.clean.join(' ');
        } else if (data.motd?.raw && data.motd.raw.length > 0) {
          motdClean = data.motd.raw.join(' ');
        }

        const realPlayerList: Array<{ username: string; uuid: string }> = [];
        if (data.players?.list && Array.isArray(data.players.list)) {
          data.players.list.forEach((p) => {
            if (typeof p === 'string') {
              realPlayerList.push({ username: p, uuid: getPlayerUuid(p) });
            } else if (p && (p as any).name) {
              realPlayerList.push({ username: (p as any).name, uuid: getPlayerUuid((p as any).name, (p as any).uuid) });
            }
          });
        }

        return {
          success: true,
          online: true,
          ip: data.hostname || cleanHost,
          port: data.port || port,
          motd: motdClean,
          version: data.version || '1.20.4',
          software: data.software || 'Java Server',
          playersOnline: data.players?.online || 0,
          maxPlayers: data.players?.max || 20,
          playerList: realPlayerList,
          icon: data.icon,
          ping: Math.max(12, elapsedPing),
        };
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // Try Secondary API Fallback (mcstatus.io)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${queryHost}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const elapsedPing = Date.now() - startTime;

    if (response.ok) {
      const data: any = await response.json();
      if (data.online) {
        const cleanMotd = data.motd?.clean || data.motd?.raw || 'Minecraft Java Server';
        const playerList: Array<{ username: string; uuid: string }> = [];
        if (data.players?.list && Array.isArray(data.players.list)) {
          data.players.list.forEach((p: any) => {
            const name = p.name_clean || p.name_raw || p.name || 'Player';
            playerList.push({
              username: name,
              uuid: getPlayerUuid(name, p.uuid),
            });
          });
        }

        return {
          success: true,
          online: true,
          ip: data.host || cleanHost,
          port: data.port || port,
          motd: cleanMotd,
          version: data.version?.name_clean || data.version?.name_raw || 'Java Server',
          software: 'Java Server',
          playersOnline: data.players?.online || 0,
          maxPlayers: data.players?.max || 20,
          playerList,
          icon: data.icon,
          ping: Math.max(12, elapsedPing),
        };
      }
    }
  } catch (e) {
    // Continue to default
  }

  const elapsedPing = Date.now() - startTime;
  return {
    success: true,
    online: false,
    ip: cleanHost,
    port,
    motd: 'Server Offline or Connecting...',
    version: '1.20.4',
    software: 'Java Server',
    playersOnline: 0,
    maxPlayers: 0,
    playerList: [],
    ping: elapsedPing,
    errorMessage: 'Server is currently offline or unreachable at this address/port.',
  };
}
