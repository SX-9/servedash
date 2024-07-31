import osu from 'node-os-utils';
import os from 'os';

export type PluginClass = {
  new (baseurl: string, key?:string): {
      getContent(): Promise<WidgetContent[]>;
  };
};

export type WidgetContent = {
  title: string,
  content: string,
  warning?: boolean,
}

export type LinkItem = {
  widget?: string,
  icon?: string,
  name: string,
  desc?: string,
  dynamic?: {
    service: string,
    api: {
      baseurl: string,
      key?: string,
    },
  },
  container?: string,
  URLlink: {
    prot: 'http' | 'https',
    host?: string,
    port: number,
    path: string,
  },
}

export type dirContents = {
  name: string,
  mask: string,
  type: 'dir' | 'file' | 'link' | 'dev' | 'pipe' | 'sock',
  size: number,
  lmod: number,
  owner: number,
  group: number,
}

export type Usage = {
  cpu: number,
  mem: osu.MemInfo,
  net: osu.NetStatMetrics,
  docker: {
    images: number,
    containers: number,
    running: number,
    stopped: number,
  }
}

export type ServerInfo = {
  username: string,
  hostname: string,
  uptime: number,
}

export type ServerInfoDetailed = {
  arch: string,
  platform: string,
  release: string,
  docker: string,
  motd: string,
  network: NodeJS.Dict<os.NetworkInterfaceInfo[]>,
}

export type ContainerInfo = {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: {
    tcp: {
      public: number,
      private: number,
    }[];
    udp: {
      public: number,
      private: number,
    }[];
  };
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'delete';

export type ContainerCreateInfo = {
  name: string,
  image: string,
  cwd: string,
  ports: {
    public: number,
    private: number,
    protocol: 'tcp' | 'udp',
  }[],
  env: {
    key: string,
    value: string,
  }[],
  volumes: {
    host: string,
    container: string,
  }[],
  cmdline: string[],
  restart: 'always' | 'unless-stopped' | 'on-failure',
}