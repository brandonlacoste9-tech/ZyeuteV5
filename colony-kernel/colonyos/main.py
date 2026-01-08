"""Main entry point for ColonyOS Kernel."""

from __future__ import annotations

import asyncio
import logging
import os
import signal
import sys
from typing import Optional

import uvicorn

from colonyos.api.rest import create_app
from colonyos.body.kernel import ColonyKernel
from colonyos.core.types import ColonyConfig, IdentityManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Initialize and start the ColonyOS Kernel API server."""
    # Load configuration from environment
    config = ColonyConfig.from_env()
    logger.info(f"Starting ColonyOS Kernel (env: {config.colony_env})")
    
    # Initialize kernel
    kernel = ColonyKernel(config)
    identity_manager = IdentityManager()
    
    # Create system identity
    system_identity, _ = identity_manager.create_identity("ColonyOS-System", "System identity")
    kernel.neurasphere.set_identity(system_identity)
    
    # Create FastAPI app
    app = create_app(kernel, identity_manager)
    
    # Get port from environment or default to 8000
    port = int(os.getenv("COLONY_PORT", "8000"))
    host = os.getenv("COLONY_HOST", "0.0.0.0")
    
    logger.info(f"Starting API server on {host}:{port}")
    
    # Run server
    config_uvicorn = uvicorn.Config(
        app,
        host=host,
        port=port,
        log_level=config.log_level.lower(),
        access_log=True,
    )
    server = uvicorn.Server(config_uvicorn)
    
    # Setup signal handlers for graceful shutdown
    def signal_handler(sig, frame):
        logger.info("Received shutdown signal, stopping server...")
        server.should_exit = True
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await server.serve()
    except Exception as e:
        logger.error(f"Server error: {e}", exc_info=True)
        raise
    finally:
        logger.info("Shutting down kernel...")
        await kernel.stop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutdown requested by user")
        sys.exit(0)
