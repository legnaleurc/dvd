import tempfile
from pathlib import Path
from unittest import TestCase

from PIL import Image

from engine.image import (
    calculate_scaled_dimensions,
    resize_image_to,
)


class TestCalculateScaledDimensions(TestCase):
    """Tests for pure dimension calculation function."""

    def test_landscape(self):
        """Landscape image: width > height."""
        width, height = calculate_scaled_dimensions(1920, 1080, 1024)
        self.assertEqual(width, 1024)
        self.assertEqual(height, 576)

    def test_portrait(self):
        """Portrait image: height > width."""
        width, height = calculate_scaled_dimensions(1080, 1920, 1024)
        self.assertEqual(width, 576)
        self.assertEqual(height, 1024)

    def test_square(self):
        """Square image: width == height."""
        width, height = calculate_scaled_dimensions(1000, 1000, 512)
        self.assertEqual(width, 512)
        self.assertEqual(height, 512)

    def test_no_scaling_needed(self):
        """Image already smaller than max_size."""
        width, height = calculate_scaled_dimensions(800, 600, 1024)
        self.assertEqual(width, 800)
        self.assertEqual(height, 600)

    def test_max_size_zero(self):
        """max_size=0 means no scaling."""
        width, height = calculate_scaled_dimensions(1920, 1080, 0)
        self.assertEqual(width, 1920)
        self.assertEqual(height, 1080)

    def test_exact_match(self):
        """Image exactly matches max_size."""
        width, height = calculate_scaled_dimensions(1024, 768, 1024)
        self.assertEqual(width, 1024)
        self.assertEqual(height, 768)

    def test_rounding(self):
        """Test rounding behavior with non-integer ratios."""
        width, height = calculate_scaled_dimensions(1920, 1000, 1024)
        self.assertEqual(width, 1024)
        # 1000 * 1024 / 1920 = 533.333... -> rounds to 533
        self.assertEqual(height, 533)


class TestResizeImage(TestCase):
    """Tests for actual image resizing function."""

    def test_resize_to_keeps_source_unchanged(self):
        """Resizing to a separate path should not mutate the source image."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            image_path = tmp_path / "test_image.jpg"
            output_path = tmp_path / "resized" / "test_image.jpg"

            img = Image.new("RGB", (1920, 1080), color="red")
            img.save(image_path, format="JPEG", quality=85)

            width, height = resize_image_to(image_path, output_path, 1024)

            self.assertEqual(width, 1024)
            self.assertEqual(height, 576)
            with Image.open(image_path) as img:
                self.assertEqual(img.size, (1920, 1080))
            with Image.open(output_path) as img:
                self.assertEqual(img.size, (1024, 576))
                self.assertEqual(img.format, "JPEG")

    def test_resize_to_preserves_png_format(self):
        """PNG format should be preserved when writing a resized variant."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            image_path = tmp_path / "test_image.png"
            output_path = tmp_path / "resized" / "test_image.png"

            img = Image.new("RGB", (1920, 1080), color="blue")
            img.save(image_path, format="PNG")

            width, height = resize_image_to(image_path, output_path, 1024)

            self.assertEqual(width, 1024)
            self.assertEqual(height, 576)
            with Image.open(image_path) as img:
                self.assertEqual(img.size, (1920, 1080))
            with Image.open(output_path) as img:
                self.assertEqual(img.size, (1024, 576))
                self.assertEqual(img.format, "PNG")
