import tempfile
from pathlib import Path
from unittest import TestCase

from PIL import Image

from engine.image import (
    calculate_scaled_dimensions,
    resize_image,
    resize_image_with_index,
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

    def test_resize_creates_smaller_file(self):
        """Integration test: resize actually modifies the file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            image_path = tmp_path / "test_image.jpg"

            # Create a test image using PIL
            img = Image.new("RGB", (1920, 1080), color="red")
            img.save(image_path, format="JPEG", quality=85)

            # Check original dimensions
            with Image.open(image_path) as img:
                self.assertEqual(img.size, (1920, 1080))

            # Resize
            width, height = resize_image(image_path, 1024)

            # Verify dimensions
            self.assertEqual(width, 1024)
            self.assertEqual(height, 576)

            # Verify file was modified
            with Image.open(image_path) as img:
                self.assertEqual(img.size, (1024, 576))
                self.assertEqual(img.format, "JPEG")

    def test_resize_png_format_preserved(self):
        """PNG format should be preserved after resize."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            image_path = tmp_path / "test_image.png"

            img = Image.new("RGB", (1920, 1080), color="blue")
            img.save(image_path, format="PNG")

            width, height = resize_image(image_path, 1024)

            self.assertEqual(width, 1024)
            self.assertEqual(height, 576)

            with Image.open(image_path) as img:
                self.assertEqual(img.size, (1024, 576))
                self.assertEqual(img.format, "PNG")

    def test_no_resize_when_not_needed(self):
        """Image smaller than max_size should not be modified."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            small_image = tmp_path / "small.jpg"

            img = Image.new("RGB", (800, 600), color="green")
            img.save(small_image, format="JPEG")

            # Attempt resize
            width, height = resize_image(small_image, 1024)

            # Should return original dimensions
            self.assertEqual(width, 800)
            self.assertEqual(height, 600)

            # File should not have been resized
            with Image.open(small_image) as img:
                self.assertEqual(img.size, (800, 600))

    def test_max_size_zero_no_resize(self):
        """max_size=0 should skip resizing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            image_path = tmp_path / "test_image.jpg"

            img = Image.new("RGB", (1920, 1080), color="yellow")
            img.save(image_path, format="JPEG")

            width, height = resize_image(image_path, 0)

            self.assertEqual(width, 1920)
            self.assertEqual(height, 1080)

            with Image.open(image_path) as img:
                self.assertEqual(img.size, (1920, 1080))


class TestResizeImageWithIndex(TestCase):
    """Tests for the wrapper function used in parallel processing."""

    def test_preserves_order(self):
        """Verify index is returned with dimensions."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            test_image = tmp_path / "test.jpg"

            img = Image.new("RGB", (1920, 1080), color="yellow")
            img.save(test_image, format="JPEG")

            # Call wrapper with index
            idx, width, height = resize_image_with_index(42, test_image, 1024)

            self.assertEqual(idx, 42)
            self.assertEqual(width, 1024)
            self.assertEqual(height, 576)

    def test_multiple_indices(self):
        """Simulate parallel processing with multiple images."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            results = []

            for i in range(3):
                test_image = tmp_path / f"test_{i}.jpg"
                img = Image.new("RGB", (1920, 1080), color="purple")
                img.save(test_image, format="JPEG")

                idx, width, height = resize_image_with_index(i, test_image, 1024)
                results.append((idx, width, height))

            # Verify all results
            self.assertEqual(len(results), 3)
            for i, (idx, width, height) in enumerate(results):
                self.assertEqual(idx, i)
                self.assertEqual(width, 1024)
                self.assertEqual(height, 576)
