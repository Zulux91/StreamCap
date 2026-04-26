import os
import sys

execute_dir = os.path.split(os.path.realpath(sys.argv[0]))[0]

__all__ = ["execute_dir"]
