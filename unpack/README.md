# unpack

Toolchain minimal require C++11.

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
