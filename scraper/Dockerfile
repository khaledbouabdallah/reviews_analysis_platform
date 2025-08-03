# Development stage
FROM ubuntu:latest as development

# Expose VNC port for development debugging
EXPOSE 5900

RUN apt-get update && apt-get install -y \
    xvfb \
    x11vnc \
    fluxbox \
    wget \
    unzip \
    gnupg \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install xterm
RUN apt-get update && apt-get install -y xterm

# Install Google Chrome from .deb (it's works only on x86 docker host machine, not ARM or Apple Silicon)
RUN apt-get update && apt-get install -y wget gnupg2 apt-utils --no-install-recommends \
    && wget --no-check-certificate https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i google-chrome-stable_current_amd64.deb || true \
    && apt-get install -fy \
    && rm -rf /var/lib/apt/lists/* google-chrome-stable_current_amd64.deb \
    && which google-chrome-stable || (echo 'Google Chrome was not installed' && exit 1)

# Install x11vnc
RUN mkdir ~/.vnc
RUN x11vnc -storepasswd 1234 ~/.vnc/passwd

# Install packages for python
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libffi-dev \
    libssl-dev \
    zlib1g-dev \
    liblzma-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev

# Download and install Python 3.10
WORKDIR /tmp2
RUN wget https://www.python.org/ftp/python/3.10.0/Python-3.10.0.tgz \
    && tar -xvf Python-3.10.0.tgz \
    && cd Python-3.10.0 \
    && ./configure --enable-optimizations \
    && make altinstall

# Download and install PIP manager for the Python 3.10
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
    && python3.10 get-pip.py

COPY ./requirements.txt /tmp/requirements.txt

# Make venv and install python dependencies
RUN python3.10 -m venv /py && \
    /py/bin/pip install --upgrade pip && \
    /py/bin/pip install --no-cache-dir -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

COPY ./app /app
COPY ./scripts /scripts

WORKDIR /app

RUN chmod -R +x /scripts

ENV PATH="/scripts:/py/bin:$PATH"
ENV DISPLAY=:0

CMD ["/scripts/startup.sh"]

# Production stage
FROM ubuntu:latest as production

# Don't expose VNC port in production for security
# EXPOSE 5900

# Install minimal required packages
RUN apt-get update && apt-get install -y \
    xvfb \
    wget \
    unzip \
    gnupg \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome from .deb
RUN apt-get update && apt-get install -y wget gnupg2 apt-utils --no-install-recommends \
    && wget --no-check-certificate https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i google-chrome-stable_current_amd64.deb || true \
    && apt-get install -fy \
    && rm -rf /var/lib/apt/lists/* google-chrome-stable_current_amd64.deb \
    && which google-chrome-stable || (echo 'Google Chrome was not installed' && exit 1)

# Install packages for python
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libffi-dev \
    libssl-dev \
    zlib1g-dev \
    liblzma-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Download and install Python 3.10
WORKDIR /tmp2
RUN wget https://www.python.org/ftp/python/3.10.0/Python-3.10.0.tgz \
    && tar -xvf Python-3.10.0.tgz \
    && cd Python-3.10.0 \
    && ./configure --enable-optimizations \
    && make altinstall \
    && rm -rf /tmp2/*

# Download and install PIP manager for the Python 3.10
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
    && python3.10 get-pip.py \
    && rm get-pip.py

# Create non-root user for security with home directory
RUN groupadd -r scraperuser && useradd -r -g scraperuser -m scraperuser

COPY ./requirements.txt /tmp/requirements.txt

# Make venv and install python dependencies
RUN python3.10 -m venv /py && \
    /py/bin/pip install --upgrade pip && \
    /py/bin/pip install --no-cache-dir -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

COPY ./app /app
COPY ./scripts /scripts

# Change ownership to non-root user
RUN chown -R scraperuser:scraperuser /app /py /scripts

# Make scripts executable
RUN chmod -R +x /scripts

WORKDIR /app

# Switch to non-root user
USER scraperuser

ENV PATH="/scripts:/py/bin:$PATH"
ENV DISPLAY=:0

CMD ["/scripts/startup.sh"]
