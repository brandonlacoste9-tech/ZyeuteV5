"""FastAPI interface for ColonyOS."""

import io
import numpy as np
from typing import Any, Dict
from PIL import Image, ImageStat
import requests

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from colonyos.body.kernel import ColonyKernel
from colonyos.core.types import ColonyConfig


class TaskSubmitRequest(BaseModel):
    description: str
    created_by: str
    priority: int = 0
    requirements: Dict[str, Any] = {}


class ImageAnalysisRequest(BaseModel):
    url: str
    region: str


class ImageAnalysisResponse(BaseModel):
    vibes_score: int
    luxury_score: int


def create_app(kernel: ColonyKernel) -> FastAPI:
    app = FastAPI(title="ColonyOS Kernel API", version="0.1.0")

    @app.on_event("startup")
    async def startup() -> None:
        await kernel.start()

    @app.on_event("shutdown")
    async def shutdown() -> None:
        await kernel.stop()

    @app.post("/tasks")
    async def submit_task(request: TaskSubmitRequest) -> Dict[str, Any]:
        task = await kernel.submit_task(
            description=request.description,
            created_by=request.created_by,
            priority=request.priority,
            requirements=request.requirements,
        )
        return task.to_wire_format()

    @app.get("/stats")
    async def get_stats() -> Dict[str, Any]:
        return kernel.get_stats()

    @app.get("/health")
    async def health() -> Dict[str, str]:
        return {"status": "ok"}

    @app.post("/analyze")
    async def analyze_image(request: ImageAnalysisRequest) -> ImageAnalysisResponse:
        """Analyze image for vibes and luxury scores using real computer vision."""
        try:
            # Download image from URL
            response = requests.get(request.url, timeout=10)
            response.raise_for_status()

            # Open image with Pillow
            image = Image.open(io.BytesIO(response.content))

            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Get basic image statistics
            stat = ImageStat.Stat(image)
            width, height = image.size

            # Calculate saturation (colorfulness)
            # Convert to HSV and analyze saturation channel
            hsv_image = image.convert('HSV')
            hsv_array = np.array(hsv_image)

            # Saturation is channel 1 in HSV
            saturation_values = hsv_array[:, :, 1].flatten()
            avg_saturation = np.mean(saturation_values) / 255.0  # Normalize to 0-1

            # Calculate contrast using RMS contrast
            gray_image = image.convert('L')
            gray_array = np.array(gray_image, dtype=np.float64)
            contrast = np.sqrt(np.mean((gray_array - np.mean(gray_array))**2)) / 128.0  # Normalize

            # Calculate brightness (value channel in HSV)
            brightness_values = hsv_array[:, :, 2].flatten()
            avg_brightness = np.mean(brightness_values) / 255.0  # Normalize to 0-1

            # Calculate color variance (diversity of colors)
            color_variance = np.var(hsv_array[:, :, 0]) / 255.0  # Hue variance

            # Calculate luxury score based on contrast, saturation, and resolution
            # Higher contrast + higher saturation + larger images = more luxurious
            luxury_score = min(100, max(0, int(
                (contrast * 40) +  # Contrast weight
                (avg_saturation * 30) +  # Saturation weight
                (min(width * height / 1000000, 1) * 20) +  # Resolution weight (capped)
                (avg_brightness * 10)  # Brightness weight
            )))

            # Calculate vibes score based on saturation, color variance, and brightness
            # More saturated + more colorful + balanced brightness = higher vibes
            vibes_score = min(100, max(0, int(
                (avg_saturation * 35) +  # Saturation weight
                (color_variance * 25) +  # Color diversity weight
                ((1 - abs(avg_brightness - 0.5) * 2) * 20) +  # Brightness balance weight
                (contrast * 20)  # Contrast weight
            )))

            # Apply regional modifiers for cultural context
            if request.region == "AR":  # Argentina - appreciates passion and contrast
                vibes_score = min(100, vibes_score + 5)  # Slight boost for vibrancy
                luxury_score = max(0, luxury_score - 3)  # Slightly less luxury-focused
            elif request.region == "MX":  # Mexico - loves color and energy
                vibes_score = min(100, vibes_score + 8)  # Boost for colorfulness
                luxury_score = min(100, luxury_score + 2)  # Slight luxury boost
            elif request.region == "BR":  # Brazil - tropical, vibrant, luxurious
                vibes_score = min(100, vibes_score + 3)  # Moderate boost
                luxury_score = min(100, luxury_score + 5)  # Higher luxury appreciation

            return ImageAnalysisResponse(
                vibes_score=vibes_score,
                luxury_score=luxury_score
            )

        except Exception as e:
            # If analysis fails, return neutral scores
            print(f"Image analysis failed: {e}")
            return ImageAnalysisResponse(
                vibes_score=50,
                luxury_score=50
            )

    return app
