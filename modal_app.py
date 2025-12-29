import modal
from colonyos.api.rest import create_app
from colonyos.body.kernel import ColonyKernel

# Define the Modal App
app = modal.App("zyeute-kernel")

# Configure the environment
image = (
    modal.Image.debian_slim()
    .pip_install("fastapi", "uvicorn", "pillow", "numpy", "requests", "pydantic")
)

@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    # Initialize the real Colony Kernel
    kernel = ColonyKernel()
    return create_app(kernel)
