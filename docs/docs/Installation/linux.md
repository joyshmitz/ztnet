---
id: debian_11
title: Standalone Debian & Ubuntu
slug: /installation/linux
description: Debian 11 installation instructions for ZTNET
sidebar_position: 2
---


## System Requirements

To build and run the application, your system should meet the following minimum requirements:

- **Memory**: 2GB of RAM
- **CPU**: 1 Core

:::note

The standalone version typically requires 2GB of RAM for optimal performance, mainly due to the demands of its build process. While installation may be possible with 1GB of RAM, some users have reported issues at this lower memory level.  
For systems with less than 2GB of RAM, we recommend using the [Docker](/installation/docker-compose) version. The [Docker](/installation/docker-compose) image is prebuilt, offering enhanced efficiency and a significantly smaller footprint.

:::

# Install or update ztnet 

Login as **root** on your system, then install `curl`, `lsb-release` and `sudo` if it is not already installed:

```bash
apt update && apt install -y sudo curl lsb-release
```

To continue install ztnet on Debian or Ubuntu, run the following command:

```bash
curl -s http://install.ztnet.network | sudo bash
```

## Application Logs

You can view the ztnet application logs using the following commands:

### View Live Logs
To watch the logs in real-time:
```bash
sudo journalctl -u ztnet -f
```

### View Recent Logs
To see the most recent logs:
```bash
sudo journalctl -u ztnet -n 100
```

## Managing the ztnet Service
When you install ztnet, a systemd service named `ztnet` is created to manage the application. You can use the following commands to manage the service as needed. 

### Monitoring Service Status

To check the status of the `ztnet` service, run the following command:

```bash
sudo systemctl status ztnet
```

### Starting the Service (default)

To start the `ztnet` service, run the following command:

```bash
sudo systemctl start ztnet
```

### Stopping the Service

To stop the `ztnet` service, run the following command:

```bash
sudo systemctl stop ztnet 
```

### Enable at boot (default)

To let the `ztnet` service start at boot, run the following command:

```bash
sudo systemctl enable ztnet
```

### Disable at boot

To stop the `ztnet` service from starting at boot, run the following command:

```bash
sudo systemctl disable ztnet
```

## Install a specific version
If you want to install a specific version of ztnet, you can specify the version like this, change `v0.7.0` to the version you want to install:
```bash
curl -s http://install.ztnet.network | sudo bash -s -- -v v0.7.0
```

## Testing other branches
:::note
Do not test in production; use a designated testing environment. Database schemas can vary between branches, and deploying a branch instead of a release may cause issues.
:::
If you want to test out a specific branch of ztnet, you can specify the branch like this, change `main` to the branch you want to test:
```bash
curl http://install.ztnet.network | sudo bash -s -- -b main
```

## Uninstalling ztnet
This will remove the ztnet systemd service and the ztnet folder.  
Postgres, Git and Node.js will not be removed.
```bash
curl -s http://install.ztnet.network | sudo bash -s -- -u
```

### Development

The installation scripts is available in the [install.ztnet](https://github.com/sinamics/ztnet/tree/main/install.ztnet) folder in main repository.

## Ztnet Environment Variables
See [Environment Variables](/installation/options#environment-variables) for more information.
