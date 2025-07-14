import pytest
from pydantic import ValidationError

# Add the project root directory to the Python path
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
# Import your ScraperConfig model
# If your ScraperConfig is in a module called 'app', you would do:
# from app.main import ScraperConfig
# Adjust the import path based on your project structure
from scraper.app.main import ScraperConfig

# Test data
valid_reviews_urls = [
    "https://www.google.com/maps/place/ZE+POULET+GRILL%C3%89/@48.6032551,2.5563247,17z/data=!4m18!1m9!3m8!1s0x47e5e53b9271c797:0x396c8733943540ba!2sCh%C3%A2teau+de+la+Grange!8m2!3d48.5996925!4d2.5578856!9m1!1b1!16s%2Fg%2F11ngpq6w0v!3m7!1s0x47e5e54e3b5a9d59:0x3e7d92be94bc4b5f!8m2!3d48.60389!4d2.552744!9m1!1b1!16s%2Fg%2F11v60rdlt9?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.com/maps/place/Shade/@36.0701868,4.7656488,15.52z/data=!4m18!1m9!3m8!1s0x47e5e53b9271c797:0x396c8733943540ba!2sCh%C3%A2teau+de+la+Grange!8m2!3d48.5996925!4d2.5578856!9m1!1b1!16s%2Fg%2F11ngpq6w0v!3m7!1s0x128cbd00580d6567:0x74243f4e84458071!8m2!3d36.0689084!4d4.7563303!9m1!1b1!16s%2Fg%2F11vqhtd7g4?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.fr/maps/place/%C3%89cole+Le+Balory/@48.5873726,2.563117,15z/data=!4m8!3m7!1s0x47e5e48e1940e4d9:0xb38c30a437fd2b5!8m2!3d48.5824984!4d2.5609046!9m1!1b1!16s%2Fg%2F113dp9s8m?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.fr/maps/place/PZA+Vrbje/@46.2465756,15.1502201,15z/data=!4m18!1m9!3m8!1s0x47e5e48e1940e4d9:0xb38c30a437fd2b5!2s%C3%89cole+Le+Balory!8m2!3d48.5824984!4d2.5609046!9m1!1b1!16s%2Fg%2F113dp9s8m!3m7!1s0x47656e55598c7483:0x2e050ab33842acce!8m2!3d46.2406394!4d15.1538724!9m1!1b1!16s%2Fg%2F11dyzdj9r_?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.fr/maps/place/%D8%B4%D9%82%D9%82+%D9%88%D8%A7%D8%AD%D8%A9+%D8%A7%D9%84%D9%86%D8%A8%D9%83+%D9%84%D9%84%D9%88%D8%AD%D8%AF%D8%A7%D8%AA+%D8%A7%D9%84%D9%85%D8%AE%D8%AF%D9%88%D9%85%D8%A9%E2%80%AD/@30.2939026,38.7116978,15.37z/data=!4m18!1m9!3m8!1s0x47e5e48e1940e4d9:0xb38c30a437fd2b5!2s%C3%89cole+Le+Balory!8m2!3d48.5824984!4d2.5609046!9m1!1b1!16s%2Fg%2F113dp9s8m!3m7!1s0x150dd9bf58a5a9d1:0x753a92dd1bb82cf0!8m2!3d30.2885821!4d38.7133177!9m1!1b1!16s%2Fg%2F11k9js9ff2?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
]


google_place_not_reviews_urls = [
    "https://www.google.com/maps/place/ZE+POULET+GRILL%C3%89/@48.6032551,2.5563247,16.96z/data=!4m16!1m9!3m8!1s0x47e5e53b9271c797:0x396c8733943540ba!2sCh%C3%A2teau+de+la+Grange!8m2!3d48.5996925!4d2.5578856!9m1!1b1!16s%2Fg%2F11ngpq6w0v!3m5!1s0x47e5e54e3b5a9d59:0x3e7d92be94bc4b5f!8m2!3d48.60389!4d2.552744!16s%2Fg%2F11v60rdlt9?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.com/maps/place/Shade/@36.0701868,4.7656488,15.52z/data=!4m16!1m9!3m8!1s0x47e5e53b9271c797:0x396c8733943540ba!2sCh%C3%A2teau+de+la+Grange!8m2!3d48.5996925!4d2.5578856!9m1!1b1!16s%2Fg%2F11ngpq6w0v!3m5!1s0x128cbd00580d6567:0x74243f4e84458071!8m2!3d36.0689084!4d4.7563303!16s%2Fg%2F11vqhtd7g4?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.fr/maps/place/%C3%89cole+Le+Balory/@48.5873726,2.563117,15z/data=!4m16!1m9!3m8!1s0x47e5e48e1940e4d9:0xb38c30a437fd2b5!2s%C3%89cole+Le+Balory!8m2!3d48.5824984!4d2.5609046!9m1!1b1!16s%2Fg%2F113dp9s8m!3m5!1s0x47e5e48e1940e4d9:0xb38c30a437fd2b5!8m2!3d48.5824984!4d2.5609046!16s%2Fg%2F113dp9s8m?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.fr/maps/place/PZA+Vrbje/@46.2465756,15.1502201,15z/data=!4m16!1m9!3m8!1s0x47e5e48e1940e4d9:0xb38c30a437fd2b5!2s%C3%89cole+Le+Balory!8m2!3d48.5824984!4d2.5609046!9m1!1b1!16s%2Fg%2F113dp9s8m!3m5!1s0x47656e55598c7483:0x2e050ab33842acce!8m2!3d46.2406394!4d15.1538724!16s%2Fg%2F11dyzdj9r_?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
    "https://www.google.fr/maps/place/%D8%B4%D9%82%D9%82+%D9%88%D8%A7%D8%AD%D8%A9+%D8%A7%D9%84%D9%86%D8%A8%D9%83+%D9%84%D9%84%D9%88%D8%AD%D8%AF%D8%A7%D8%AA+%D8%A7%D9%84%D9%85%D8%AE%D8%AF%D9%88%D9%85%D8%A9%E2%80%AD/@30.2939026,38.7116978,15.37z/data=!4m16!1m9!3m8!1s0x47e5e48e1940e4d9:0xb38c30a437fd2b5!2s%C3%89cole+Le+Balory!8m2!3d48.5824984!4d2.5609046!9m1!1b1!16s%2Fg%2F113dp9s8m!3m5!1s0x150dd9bf58a5a9d1:0x753a92dd1bb82cf0!8m2!3d30.2885821!4d38.7133177!16s%2Fg%2F11k9js9ff2?entry=ttu&g_ep=EgoyMDI1MDQwNy4wIKXMDSoASAFQAw%3D%3D",
]


not_google_maps_url = [
    "https://huggingface.co/models?language=ar&sort=trending",
    "https://www.deepl.com/en/translator",
]


def test_valid_reviews_urls():
    """Test that valid Google Maps review URLs pass validation"""
    for url in valid_reviews_urls:
        config = ScraperConfig(url=url)
        assert config.url == url


def test_google_place_not_reviews_urls():
    """Test that Google Maps place URLs without review sections fail validation"""
    for url in google_place_not_reviews_urls:
        with pytest.raises(ValidationError):
            ScraperConfig(url=url)


def test_not_google_maps_url():
    """Test that non-Google Maps URLs fail validation"""
    for url in not_google_maps_url:
        with pytest.raises(ValidationError):
            ScraperConfig(url=url)
