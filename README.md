# Drive View Daemon

Just a silly drive viewer.

## Dependencies

### unpack

This module uses C++11, so if you are not using an old toolchain from ten years
ago, you will be fine.

Other libraries you will need:

* Boost
* libarchive
* cpprestsdk

For Debian based system:

```sh
apt-get install libboost-thread-dev libboost-filesystem-dev libarchive-dev libcpprest-dev
```

For Mac OS X which using Homebrew:

```sh
brew install boost libarchive cpprestsdk
```

You may need to add the above libraries to CMAKE_PREFIX_PATH, because Homebrew
wont do that for you, e.g.:

```sh
export CMAKE_PREFIX_PATH="/usr/local/opt/libarchive:/usr/local/opt/openssl"
```

### engine

This module uses Python 3.7.

```sh
pip install -r engine/requirements.txt
```

Then you need to initialize the drive cache.

```sh
python3 -m wcpan.drive.google sync
```

### viewer

This module uses Node.js 16 or later.

```sh
cd viewer
npm install
```

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
