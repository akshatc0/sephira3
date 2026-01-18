import os
import sys

# Add the parent directory to sys.path to allow importing app from root
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app import app
