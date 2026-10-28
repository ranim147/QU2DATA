import os
import subprocess
import sys
from pathlib import Path

VENV_DIR = "venv"
REQUIREMENTS_FILE = "requirements.txt"
APP = "main:app"
HOST = "0.0.0.0"
PORT = "8000"


def run(command):
    print("> " + " ".join(command))
    subprocess.check_call(command)


def main():
    venv_path = Path(VENV_DIR)

    # Create virtual environment
    if not venv_path.exists():
        print("Creating virtual environment...")
        run([sys.executable, "-m", "venv", VENV_DIR])

    # Python executable inside the venv
    if os.name == "nt":
        python = venv_path / "Scripts" / "python.exe"
    else:
        python = venv_path / "bin" / "python"

    # Upgrade pip
    run([str(python), "-m", "pip", "install", "--upgrade", "pip"])

    # Install requirements
    if Path(REQUIREMENTS_FILE).exists():
        run([str(python), "-m", "pip", "install", "-r", REQUIREMENTS_FILE])

    # Start FastAPI with Uvicorn
    print("\nStarting FastAPI...")
    subprocess.call([
        str(python),
        "-m",
        "uvicorn",
        APP,
        "--host",
        HOST,
        "--port",
        PORT,
        "--reload",
    ])


if __name__ == "__main__":
    main()