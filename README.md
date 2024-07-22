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
To configure the dashboard, you can use the following YAML format:

```yaml
# links:
- name: Name of the link
  icon: URL to the icon (optional)
  desc: Description of the link (optional)
  container: Container name for status checks (optional)
  URLlink:
    prot: https (or http)
    host: example.com (leave empty for the current domain)
    port: 80
    path: /path/to/page

# widgets:
- widget: Widget type, overrides every other options (can either be uptime, usages, network, and containers)
```
