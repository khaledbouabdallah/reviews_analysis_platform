import sys
import os
from pathlib import Path


# Find the project root directory
def find_project_root():
    current_path = Path(__file__).parent.absolute()
    marker_files = [".git", "setup.py", "pyproject.toml", "requirements.txt"]

    while current_path != current_path.parent:
        for marker in marker_files:
            if (current_path / marker).exists():
                return current_path
        current_path = current_path.parent

    raise FileNotFoundError("Project root not found")


# Add project root to Python path
project_root = find_project_root()
sys.path.insert(0, str(project_root))
