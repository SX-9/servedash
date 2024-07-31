# ServeDash
a simple dashboard for servers

## Installation and Updating
Requirements:
- nodejs & npm (the server)
- git (for cloning, alternatively you can download the repository)
- nginx (for reverse proxy and authentication)
- docker (for the containers tab)

Clone the repository and run the install script:
```bash
sudo ./install.sh
```

## Configuration
To configure the dashboard, you can use the following YAML format in /etc/servedash/config.yaml:

```yaml
# links:
- name: pihole # Name of the link
  icon: /favicon.png # URL to the icon (optional)
  desc: dns sinkhole # Description of the link (optional)
  dynamic: # Requires "container" to be set
    service: pihole
    api:
      key: pihole_api_key # API key for the service
      baseurl: http://127.0.0.1:8800 # Base URL for the service
  container: pihole # Container name for status checks (optional)
  URLlink:
    prot: https (or http)
    host: example.com (leave empty for the current domain)
    port: 80
    path: /path/to/page

# widgets:
- widget: Widget type, overrides every other options (can either be uptime, usages, network, and containers)
```
