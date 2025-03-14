\!#/bin/bash
# Update package lists and install prerequisites
sudo apt update
sudo apt install -y wget unzip

# Install Google Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb  # Clean up the installer

# Verify Google Chrome installation
echo google-chrome --version

# Get the installed Chrome version
#CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d'.' -f1)

# Download ChromeDriver matching the Chrome version
wget https://storage.googleapis.com/chrome-for-testing-public/132.0.6834.83/linux64/chromedriver-linux64.zip

# Unzip and move ChromeDriver to the Driver folder
mkdir -p Driver
unzip chromedriver-linux64.zip -d Driver
rm chromedriver-linux64.zip  # Clean up the zip file
mv Driver/chromedriver-linux64/chromedriver Driver/chromedriver
rm -r Driver/chromedriver-linux64

# Verify ChromeDriver installation
./Driver/chromedriver --version