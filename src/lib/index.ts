import type { ContainerAction, ContainerCreateInfo, ContainerInfo, ServerInfo, ServerInfoDetailed, Usage } from './types';
import osu, { type NetStatMetrics } from 'node-os-utils';
import { readFileSync } from 'fs';
import Docker from 'dockerode';
import os from 'os';
import type OsCmd from 'node-os-utils/lib/oscmd';

export const docker = new Docker();

export function delay(milliseconds: number) {
  return new Promise(function run(resolve) {
    setTimeout(resolve, milliseconds)
  })
}

export function createContainer(ct: ContainerCreateInfo) {
  return docker.createContainer({
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: false,
    OpenStdin: false,
    Tty: true,
    name: ct.name,
    Image: ct.image,
    Cmd: ct.cmdline,
    WorkingDir: ct.cwd,
    Env: ct.env.map((env) => 
      `${env.key}=${env.value}`
    ),
    ExposedPorts: Object.fromEntries(ct.ports.map(port => [
      `${port.private}/${port.protocol}`, {}
    ])),
    HostConfig: {
      PortBindings: Object.fromEntries(ct.ports.map(port => [
        `${port.private}/${port.protocol}`, 
        [{
          HostPort: `${port.public}`,
          HostIp: '0.0.0.0',
        }]
      ])),
      RestartPolicy: {
        Name: ct.restart,
      },
      Mounts: ct.volumes.map(volume => ({
        Type: 'bind',
        Source: volume.host,
        Target: volume.container,
      })),
    }
  });
}

export async function doContainer(action: ContainerAction, id: string) {
  const container = docker.getContainer(id);
  switch (action) {
    case 'start':
      return await container.start();
    case 'stop':
      return await container.stop();
    case 'restart':
      return await container.restart();
    case 'delete':
      return await container.remove();
  }
}

export async function getContainers(): Promise<ContainerInfo[]> {
  const containers = await docker.listContainers({
    all: true,
  });
  return containers.map(container => {
    return {
      id: container.Id,
      name: container.Names[0],
      image: container.Image,
      status: container.State,
      ports: {
        tcp: container.Ports.filter(port => port.Type === 'tcp' && port.IP === '0.0.0.0').map(port => ({
          public: port.PublicPort,
          private: port.PrivatePort,
        })),
        udp: container.Ports.filter(port => port.Type === 'udp' && port.IP === '0.0.0.0').map(port => ({
          public: port.PublicPort,
          private: port.PrivatePort,
        })),
      },
    }
  });
}

export async function getDetailedInfo(): Promise<ServerInfoDetailed> {
  const dockerInfo = await docker.version();
  return {
    arch: os.arch(),
    platform: os.platform(),
    release: os.release(),
    network: os.networkInterfaces(),
    motd: readFileSync('/etc/motd').toString('utf8'),
    docker: dockerInfo.Version,
  }
}

export async function getServerInfo(): Promise <ServerInfo> {
  return {
    // ignore the typescript error
    username: (await (osu?.osCmd as OsCmd).whoami()).trim(),
    hostname: osu.os.hostname(),
    uptime: osu.os.uptime(),
  };
}

export async function getUsage(): Promise<Usage> {
  try {
    const dockerInfo = await docker.info();
    return {
      cpu: await osu.cpu.usage(),
      mem: await osu.mem.info(),
      net: await osu.netstat.inOut() as NetStatMetrics,
      docker: {
        images: dockerInfo.Images,
        containers: dockerInfo.Containers,
        running: dockerInfo.ContainersRunning,
        stopped: dockerInfo.ContainersStopped,
      }
    }
  } catch {
    return {
      cpu: 0,
      mem: {
        totalMemMb: 0,
        freeMemMb: 0,
        usedMemMb: 0,
        freeMemPercentage: 0,
        usedMemPercentage: 0,
      },
      net: {
        total: {
          inputMb: 0,
          outputMb: 0,
        },
      },
      docker: {
        images: 0,
        containers: 0,
        running: 0,
        stopped: 0,
      }
    }
  }
}
