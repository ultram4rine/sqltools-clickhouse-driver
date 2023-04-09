# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && grep -q sse4_2 /proc/cpuinfo && echo "SSE 4.2 supported" || { echo "SSE 4.2 not supported" && exit 1; } \
    && GNUPGHOME=$(mktemp -d) \
    && GNUPGHOME="$GNUPGHOME" gpg --no-default-keyring --keyring /usr/share/keyrings/clickhouse-keyring.gpg --keyserver keyserver.ubuntu.com --recv-keys 8919F6BD2B48D754 \
    && rm -rf "$GNUPGHOME" \
    && chmod +r /usr/share/keyrings/clickhouse-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/clickhouse-keyring.gpg] https://packages.clickhouse.com/deb stable main" | tee /etc/apt/sources.list.d/clickhouse.list \
    && apt-get update \
    && apt-get install --yes --no-install-recommends clickhouse-client clickhouse-common-static \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
RUN su node -c "npm install -g typescript npm-check-updates"
