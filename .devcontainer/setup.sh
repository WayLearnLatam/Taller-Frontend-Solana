#!/usr/bin/env bash
set -e

apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      build-essential \
      pkg-config \
      libssl-dev \
      sudo \
      tini

curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"

curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.profile

solana --version

echo "--- Instalación de Rust, Solana y Anchor completada ---"

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install node
nvm use node

npm install -g yarn

echo "Entorno listo para usar!!! :D"
