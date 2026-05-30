FROM node:20-bullseye

# Install dependencies for downloading and running RealESRGAN
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Setup working directory
WORKDIR /app

# Download RealESRGAN binary (Linux)
# Using a specific version for stability
RUN wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip \
    && unzip realesrgan-ncnn-vulkan-20220424-ubuntu.zip \
    && chmod +x realesrgan-ncnn-vulkan \
    && rm realesrgan-ncnn-vulkan-20220424-ubuntu.zip

# Create package.json
RUN npm init -y && npm install pg dotenv @supabase/supabase-js

# Copy worker script
COPY index.js .

# Start the worker
CMD ["node", "index.js"]
