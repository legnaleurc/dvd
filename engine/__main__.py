import asyncio
import sys

from .main import main

rv = main(sys.argv)
rv = asyncio.run(rv)
sys.exit(rv)
