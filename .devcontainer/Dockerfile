# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && grep -q sse4_2 /proc/cpuinfo && echo "SSE 4.2 supported" || { echo "SSE 4.2 not supported" && exit 1; } \
    && apt-get install -y  --no-install-recommends apt-transport-https=2.2.4 ca-certificates=20210119 dirmngr=2.2.27-2+deb11u2 \
    && apt-key adv --keyserver keyserver.ubuntu.com --recv 8919F6BD2B48D754 \
    && echo "deb https://packages.clickhouse.com/deb stable main" | tee /etc/apt/sources.list.d/clickhouse.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends clickhouse-client=22.8.12.45 clickhouse-common-static=22.8.12.45 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
RUN su node -c "npm install -g typescript npm-check-updates"
