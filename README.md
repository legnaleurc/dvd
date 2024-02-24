# Drive View Daemon

Just a silly drive viewer.

## Modules

### unpack

Please see `unpack` directory.

### engine

Please see `engine` directory.

### viewer

Please see `viewer` directory.

## Run the Daemon

Just run the following script:

```sh
./dvd
```

By default it will listen on localhost 8000. You can change this by options.

If you want to develop this project, simply run:

```sh
./dvd --debug
```

## Run the Daemon in Docker

Ensure you have `.env` sets correctly:

```sh
# Use the example file as a template.
cp .env.example .env
```

Build the images with Docker Compose:

```sh
docker compose build
```

You can run the `wcpan.drive.cli` tool with `engine` image:

```sh
# Login for the container before the first run.
docker compose run --rm engine wdcli auth
```

Start the containers:

```sh
docker compose up
```

For now this is only used for production.
