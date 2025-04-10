# \!#/bin/bash
# # Update package lists and install prerequisites
# sudo apt update
# sudo apt install -y wget unzip

# # Install Google Chrome
# wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# sudo apt install -y ./google-chrome-stable_current_amd64.deb
# rm google-chrome-stable_current_amd64.deb  # Clean up the installer

# # Verify Google Chrome installation
# echo google-chrome --version

# # Get the installed Chrome version
# #CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d'.' -f1)

# # Download ChromeDriver matching the Chrome version
# wget https://storage.googleapis.com/chrome-for-testing-public/132.0.6834.83/linux64/chromedriver-linux64.zip

# # Unzip and move ChromeDriver to the Driver folder
# mkdir -p Driver
# unzip chromedriver-linux64.zip -d Driver
# rm chromedriver-linux64.zip  # Clean up the zip file
# mv Driver/chromedriver-linux64/chromedriver Driver/chromedriver
# rm -r Driver/chromedriver-linux64

# # Verify ChromeDriver installation
# ./Driver/chromedriver --version


#!/bin/bash
# Script to install specific Chrome version and matching ChromeDriver

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting Chrome and ChromeDriver installation..."

# Define Chrome and ChromeDriver versions
CHROME_VERSION="132.0.6834.83"
CHROMEDRIVER_VERSION="132.0.6834.83"

# Update package lists and install prerequisites
echo "Installing prerequisites..."
sudo apt update
sudo apt install -y wget unzip apt-transport-https ca-certificates curl

# Install specific Chrome version
echo "Installing Chrome version $CHROME_VERSION..."

# Option 1: Install specific Chrome version from Google's repository
# First, remove current Chrome if installed
if dpkg -l | grep -q google-chrome-stable; then
  echo "Removing existing Chrome installation..."
  sudo apt remove -y google-chrome-stable
fi

# Download specific Chrome version
echo "Downloading Chrome version $CHROME_VERSION..."
wget "https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}-1_amd64.deb" -O chrome.deb

# Install the downloaded Chrome package
echo "Installing Chrome package..."
sudo apt install -y ./chrome.deb
rm chrome.deb  # Clean up the installer

# Prevent automatic updates
echo "Preventing automatic Chrome updates..."
sudo apt-mark hold google-chrome-stable

# Install ChromeDriver matching the Chrome version
echo "Installing ChromeDriver version $CHROMEDRIVER_VERSION..."
wget "https://storage.googleapis.com/chrome-for-testing-public/${CHROMEDRIVER_VERSION}/linux64/chromedriver-linux64.zip"

# Create Driver directory if it doesn't exist
mkdir -p Driver

# Unzip and move ChromeDriver to the Driver folder
unzip chromedriver-linux64.zip -d Driver
rm chromedriver-linux64.zip  # Clean up the zip file
mv Driver/chromedriver-linux64/chromedriver Driver/chromedriver
rm -r Driver/chromedriver-linux64

# Make ChromeDriver executable
chmod +x Driver/chromedriver

# Verify installations
echo "Installation complete. Verifying versions:"
echo "Chrome version:"
google-chrome --version

echo "ChromeDriver version:"
./Driver/chromedriver --version

echo "Chrome and ChromeDriver installation completed successfully!"