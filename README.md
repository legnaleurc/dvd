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

### engine

This module uses Python 3.7.

```sh
pip install -r requirements.txt
```

Then you need to initialize the drive cache.

```sh
python3 -m wcpan.drive.google sync
```

### viewer

This module uses Node.js 10 or later. It also uses yarn instead of npm.

```sh
cd viewer
yarn install
```
