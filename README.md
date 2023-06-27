# Toad CLI and Toad Server

Welcome to the `Toad` project, a command-line tool designed to simplify the process of deploying your projects to a server. Using `Toad CLI` and `Toad Server`, you can upload, start, stop, and monitor your projects with ease.

## Getting Started

### Server Setup

Before you start, you'll need to setup `Toad Server` on your Virtual Private Server (VPS) or any Linux machine.

1. Install `Toad Server` globally using npm:

```sh
npm i -g toad-server
```

2. Run `Toad Server`.

Make sure to configure `Toad Server` with necessary configurations. This involves setting up a configuration file where the `Conf` package stores its data, including a token for authentication and Redis host/port and password for data storage and management.

This configuration file is usually located at `/home/USER/.config/toad-server/config.json`.

### CLI Setup

Once `Toad Server` is up and running, you can setup `Toad CLI` on the machine where your project's source code is located.

1. Install `Toad CLI` globally using npm:

```sh
npm i -g toad-cli
```

2. Run the `setup` command with the `-t` option to provide the server's token and the `-d` option to specify the domain of the server where `Toad Server` is installed.

Example:

```sh
toad setup -t YOUR_SERVER_TOKEN -d YOUR_SERVER_DOMAIN
```

## Project Deployment

With `Toad CLI` setup, you're ready to deploy your projects.

1. Navigate to your project directory.
2. Run `toad init` to initialize your project for the `Toad` system. This might involve creating some configuration files or making other necessary preparations.
3. Use `toad up` to upload the latest changes of your project to the server.

Example:

```sh
cd my-project/
toad init
toad up
```

## Project Management

`Toad CLI` provides several commands to manage your project on the server.

- `toad start`: Starts your project on the server.
- `toad stop`: Stops your project on the server.
- `toad status`: Checks the running status of your project on the server.

Example:

```sh
toad start
toad stop
toad status
```

That's it! With `Toad CLI` and `Toad Server`, managing and deploying your projects has never been easier.

## License

`Toad CLI` and `Toad Server` are [MIT licensed](LICENSE).
