import asyncio
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase

from PIL import Image

from engine.scaling import (
    ImageScalingService,
    calculate_scaled_dimensions,
    create_scaling_service,
)


class TestScalingModule(IsolatedAsyncioTestCase):
    def test_calculate_scaled_dimensions_no_scaling_needed(self):
        """Images within bounds don't need scaling."""
        # Test module-level function (no service instance needed)

        # Already within bounds
        self.assertEqual(calculate_scaled_dimensions(640, 480, 800), (640, 480))

        # max_size = 0 (no scaling)
        self.assertEqual(calculate_scaled_dimensions(1920, 1080, 0), (1920, 1080))

    def test_calculate_scaled_dimensions_landscape(self):
        """Landscape images scale width to max_size."""
        # 1920x1080 -> 800x450
        self.assertEqual(calculate_scaled_dimensions(1920, 1080, 800), (800, 450))

    def test_calculate_scaled_dimensions_portrait(self):
        """Portrait images scale height to max_size."""
        # 1080x1920 -> 450x800
        self.assertEqual(calculate_scaled_dimensions(1080, 1920, 800), (450, 800))

    def test_calculate_scaled_dimensions_square(self):
        """Square images scale to max_size x max_size."""
        # 1920x1920 -> 800x800
        self.assertEqual(calculate_scaled_dimensions(1920, 1920, 800), (800, 800))

    async def test_ensure_scaled_already_scaled(self):
        """Fast path when image is already scaled."""
        async with create_scaling_service() as service:
            image_dict = {"id": "/tmp/test.jpg", "scaled": True}

            # Should return immediately without scaling
            await service.ensure_scaled(image_dict, ("node", 0, 800))

            self.assertTrue(image_dict["scaled"])

    async def test_scale_image_jpeg(self):
        """Integration test: Scale JPEG image."""
        with TemporaryDirectory() as tmpdir:
            # Create a test JPEG image
            test_path = Path(tmpdir) / "test.jpg"
            img = Image.new("RGB", (1920, 1080), color="red")
            img.save(test_path, "JPEG")

            # Scale it using ensure_scaled
            async with create_scaling_service() as service:
                image_dict = {
                    "id": str(test_path),
                    "scaled": False,
                    "width": 800,  # Target dimensions (from manifest)
                    "height": 450,
                }
                await service.ensure_scaled(image_dict, ("test", 0, 800))

            # Verify image was scaled
            self.assertTrue(image_dict["scaled"])

            # Verify file was modified
            with Image.open(test_path) as img:
                self.assertEqual(img.size, (800, 450))

    async def test_concurrent_ensure_scaled(self):
        """SingleFlight coordination prevents duplicate work."""
        with TemporaryDirectory() as tmpdir:
            test_path = Path(tmpdir) / "test.jpg"
            img = Image.new("RGB", (1920, 1080), color="blue")
            img.save(test_path, "JPEG")

            async with create_scaling_service() as service:
                image_dict = {
                    "id": str(test_path),
                    "scaled": False,
                    "width": 800,  # Target dimensions (from manifest)
                    "height": 450,
                }

                key = ("node", 0, 800)

                # Start 5 concurrent scaling requests
                tasks = [service.ensure_scaled(image_dict, key) for _ in range(5)]

                await asyncio.gather(*tasks)

                # Image should be scaled
                self.assertTrue(image_dict["scaled"])

                with Image.open(test_path) as img:
                    self.assertEqual(img.size, (800, 450))
