import json
import logging
import os
import random
import re
import tempfile
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from exceptions import JobCancelledException

import pandas as pd
import undetected_chromedriver as uc
from dateutil.relativedelta import relativedelta
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
)
from selenium.webdriver.common.by import By

# import types for type hinting
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

ignored_exceptions = (
    NoSuchElementException,
    StaleElementReferenceException,
)


NOW = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
MAPS_LINK = "https://www.google.com/maps"

# go to parent directory
os.chdir(os.path.dirname(os.getcwd()))


@dataclass
class ScraperConfig:
    """Configuration class for GoogleMapsReviewScraper"""

    headless: bool = True
    verbose: bool = False
    timeout: int = 10
    original: bool = True
    language: str = "en"
    concat_extra: bool = False
    log_file: str | None = None
    extra_headers: list[str] = field(default_factory=list)
    progress_callback: Callable[[dict[str, Any]], None] | None = None


def parse_relative_date(text: str) -> str:
    text = text.strip().lower()

    # Remove optional words like "edited", "on", etc.
    text = re.sub(r"^(edited|updated)\s+", "", text)
    text = re.sub(r"\s+on$", "", text)

    # Convert "a" to "1" for expressions like "a year ago"
    text = re.sub(r"\ba\b", "1", text)

    # Try to match expressions like "1 year ago", "16 hours ago", etc.
    match = re.match(r"(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago", text)
    if not match:
        if "just now" in text or "moments ago" in text:
            return datetime.now().strftime("%Y-%m-%d")
        raise ValueError(f"Unrecognized time format: '{text}'")

    value, unit = int(match.group(1)), match.group(2)
    now = datetime.now()

    if unit == "second":
        delta = timedelta(seconds=value)
    elif unit == "minute":
        delta = timedelta(minutes=value)
    elif unit == "hour":
        delta = timedelta(hours=value)
    elif unit == "day":
        delta = timedelta(days=value)
    elif unit == "week":
        delta = timedelta(weeks=value)
    elif unit == "month":
        delta = relativedelta(months=value)
    elif unit == "year":
        delta = relativedelta(years=value)
    else:
        raise ValueError(f"Unknown time unit: {unit}")

    result_date = now - delta
    return result_date.strftime("%Y-%m-%d")


def convert_to_google_com(url: str) -> str:
    """Convert any Google Maps URL to use google.com domain.

    Args:
        url (str): The original Google Maps URL with any domain

    Returns:
        str: The same URL but with google.com domain

    """
    # Pattern to match google.XX or maps.google.XX in the URL
    pattern = (
        r"(https?://)(?:www\.)?(google\.|maps\.google\.)[a-z]{2,}(\.[a-z]{2,})?(\/)"
    )

    # Replace with google.com
    converted_url = re.sub(pattern, r"\1\2com\4", url)

    return converted_url


class GoogleMapsReviewScraper:
    """A class to scrape Google Maps reviews for a given location."""

    accepted_languages = ["en", "fr", "de", "es", "it", "nl", "ja", "pt", "ru", "zh-CN"]

    def __init__(
        self,
        headless: bool = True,
        verbose: bool = False,
        timeout: int = 10,
        original: bool = True,
        language: str = "en",
        concat_extra: bool = False,
        log_file: str | None = None,
        extra_headers: list[str] | None = None,
        progress_callback: Callable[[dict[str, Any]], None] | None = None,
        config: ScraperConfig | None = None,
    ):
        """Initialize the scraper with configuration.

        Args:
            config: ScraperConfig object (takes precedence if provided)
            **kwargs: Individual parameters for backward compatibility

        """
        # Use config if provided, otherwise create from individual parameters
        if config:
            self.config = config
        else:
            self.config = ScraperConfig(
                headless=headless,
                verbose=verbose,
                timeout=timeout,
                original=original,
                language=language,
                concat_extra=concat_extra,
                log_file=log_file,
                extra_headers=extra_headers or [],
                progress_callback=progress_callback,
            )

        self.now = NOW
        self.cookies_accepted = False
        self.start_time = time.time()

        # Setup logging
        self._setup_logging()

        # Validate language
        if self.config.language not in self.accepted_languages:
            raise ValueError(
                f"Language '{self.config.language}' not supported. "
                f"Accepted languages: {self.accepted_languages}",
            )

        # Initialize driver
        self._init_driver()

        # Connect to Google Maps
        self._connect_to_maps()

    def _setup_logging(self) -> None:
        """Setup structured logging configuration"""

        log_level = logging.DEBUG if self.config.verbose else logging.INFO

        # Create formatter with consistent structure
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s",
        )

        # Configure logger
        self.logger = logging.getLogger(f"GoogleMapsScraper_{self.now}")
        self.logger.setLevel(log_level)

        # Clear existing handlers
        self.logger.handlers.clear()

        # Add file handler if specified
        if self.config.log_file:
            try:
                # Use environment variable or temp directory
                log_dir = os.environ.get("LOG_DIR", tempfile.gettempdir())
                log_path = os.path.join(
                    log_dir, f"{self.config.log_file}_{self.now}.log"
                )

                # Only create directory if it's not temp and doesn't exist
                if log_dir != tempfile.gettempdir() and not os.path.exists(log_dir):
                    os.makedirs(log_dir, exist_ok=True)

                file_handler = logging.FileHandler(log_path)
                file_handler.setFormatter(formatter)
                self.logger.addHandler(file_handler)

            except (PermissionError, OSError) as e:
                # Fallback to console-only logging
                self.logger.warning(
                    f"Could not create log file: {e}. Using console logging only."
                )

        # Add console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

        self.logger.info(
            "Scraper initialized with configuration",
            extra={
                "headless": self.config.headless,
                "language": self.config.language,
                "timeout": self.config.timeout,
            },
        )

    def _init_driver(self) -> None:
        """Initialize the Chrome driver with proper configuration"""
        try:
            self.logger.info("Initializing Chrome driver...")

            # Force undetected_chromedriver to use writable directory

            os.environ["HOME"] = "/tmp"  # Override HOME directory

            options = uc.ChromeOptions()
            options.arguments.extend(["--no-sandbox", "--disable-setuid-sandbox"])
            options.arguments.extend(self.config.extra_headers)

            # Add writable directory arguments for containerized environments
            options.add_argument("--user-data-dir=/tmp/chrome-user-data")
            options.add_argument("--data-path=/tmp/chrome-data")
            options.add_argument("--disk-cache-dir=/tmp/chrome-cache")
            options.add_argument("--disable-dev-shm-usage")

            if self.config.headless:
                options.add_argument("--headless")

            # Try without user_data_dir parameter to avoid conflicts
            self.driver = uc.Chrome(
                headless=self.config.headless,
                use_subprocess=False,
                options=options,
            )

            # Set up WebDriverWait
            self.wait = WebDriverWait(
                driver=self.driver,
                ignored_exceptions=ignored_exceptions,
                timeout=self.config.timeout,
            )
            self.logger.info("Chrome driver initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Chrome driver: {e}")
            raise RuntimeError(f"Driver initialization failed: {e}")

    def _connect_to_maps(self) -> None:
        """Connect to Google Maps and handle initial setup"""
        try:
            self.logger.info(f"Connecting to Google Maps: {MAPS_LINK}")
            start_time = time.time()

            self.driver.get(MAPS_LINK)
            time.sleep(random.uniform(4, 10))
            self.accept_cookies()

            elapsed = time.time() - start_time
            self.logger.info(
                f"Connected to Google Maps successfully (took {elapsed:.2f}s)",
            )

        except Exception as e:
            self.logger.error(f"Failed to connect to Google Maps: {e}")
            raise RuntimeError(f"Google Maps connection failed: {e}")

    def _emit_progress(self, event_type: str, data: dict[str, Any]) -> None:
        """Emit progress event if callback is configured"""
        if self.config.progress_callback:
            progress_data = {
                "event_type": event_type,
                "timestamp": datetime.now().isoformat(),
                "elapsed_time": time.time() - self.start_time,
                **data,
            }
            try:
                self.config.progress_callback(progress_data)
            except JobCancelledException:
                raise 
            except Exception as e:
                self.logger.warning(f"Progress callback failed: {e}")

    def accept_cookies(self) -> None:
        """Accept cookies banner with improved error handling"""
        try:
            self.logger.info("Looking for cookies acceptance button...")

            accept_button, _ = self._get_element_(
                "//*[@id='yDmH0d']/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/div[1]/form[2]/div/div/button",
                type_=By.XPATH,
                operation="accept cookies",
            )

            time.sleep(0.5)
            accept_button.click()
            time.sleep(0.5)

            self.logger.info("Clicked cookies acceptance button")

            # Verify cookies are accepted
            self._verify_cookies_accepted()

        except Exception as e:
            self.logger.error(f"Failed to accept cookies: {e}")
        finally:
            self._verify_cookies_accepted()

    def _verify_cookies_accepted(self) -> None:
        """Verify that cookies banner is no longer visible"""
        try:
            cookie_banner = self.driver.find_element(
                By.XPATH,
                "//*[@id='yDmH0d']/c-wiz/div/div/div/div[2]/div[1]",
            )

            if cookie_banner.is_displayed():
                self.logger.warning("Cookie banner still visible, retrying...")
                time.sleep(2)

                accept_button, _ = self._get_element_(
                    "//*[@id='yDmH0d']/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/div[1]/form[2]/div/div/button",
                    type_=By.XPATH,
                    operation="accept cookies retry",
                )
                accept_button.click()

        except NoSuchElementException:
            self.logger.info("Cookies accepted successfully")
            self.cookies_accepted = True

    def connect(self, url: str) -> int:
        """Connect to the target URL and extract total review count.

        Args:
            url: Google Maps URL

        Returns:
            int: Total number of reviews found

        Raises:
            RuntimeError: If connection or review extraction fails

        """
        try:
            # Prepare URL

            processed_url = f"{url}&hl={self.config.language}"
            processed_url = convert_to_google_com(processed_url)
            self.logger.info(f"Connecting to target URL: {processed_url}")
            self._emit_progress("url_connection", {"url": processed_url})

            connection_start = time.time()
            self.driver.get(processed_url)

            if not self.cookies_accepted:
                self.accept_cookies()

            # Determine if this is a hotel listing
            is_hotel = self._check_if_hotel()
            self.logger.info(
                f"Location type detected: {'hotel' if is_hotel else 'business'}",
            )

            # Extract total reviews
            total_reviews = self._extract_total_reviews()

            connection_time = time.time() - connection_start
            self.logger.info(
                f"Connected successfully. Found {total_reviews} reviews (took {connection_time:.2f}s)",
            )

            self._emit_progress(
                "connection_complete",
                {
                    "total_reviews": total_reviews,
                    "is_hotel": is_hotel,
                    "connection_time": connection_time,
                },
            )

            return total_reviews

        except JobCancelledException:
            raise
        except Exception as e:
            self.logger.error(f"Connection failed: {e}")
            raise RuntimeError(f"Failed to connect to URL '{url}': {e}")

    def _check_if_hotel(self) -> bool:
        """Check if the current page is a hotel listing"""
        try:
            self._get_element_("A1zNzb", By.CLASS_NAME, operation="hotel detection")
            return True
        except (TimeoutException, NoSuchElementException):
            return False

    def _extract_total_reviews(self) -> int:
        """Extract total number of reviews from the page"""
        try:
            targets = [("//div[contains(@class, 'jANrlb')]/div[3]", By.XPATH)]

            total_reviews_element, _ = self._get_element_(
                targets,
                type_=By.XPATH,
                operation="extract total reviews",
            )

            total_reviews_text = total_reviews_element.text
            total_reviews = int(re.sub(r"\D", "", total_reviews_text))

            return total_reviews

        except Exception as e:
            self.logger.error(f"Failed to extract total reviews: {e}")
            raise RuntimeError(f"Could not extract review count: {e}")

    def extract_data(self, total_reviews: int) -> list[dict[str, Any]]:
        """Extract review data with progress tracking.

        Args:
            total_reviews: Expected number of reviews

        Returns:
            List of review dictionaries

        Raises:
            RuntimeError: If extraction fails after retries

        """
        try:
            
            self.logger.info(f"Starting review extraction for {total_reviews} reviews")
            self._emit_progress("extraction_start", {"total_reviews": total_reviews})

            extraction_start = time.time()
            # Setup for review extraction
            self._setup_review_extraction()

            # Get scrollable container
            scrollable_div = self._get_scrollable_container()

            # Extract reviews with retries
            reviews_data = self._extract_reviews_with_retries(
                total_reviews,
                scrollable_div,
            )

            extraction_time = time.time() - extraction_start
            self.logger.info(
                f"Extraction completed: {len(reviews_data)} reviews in {extraction_time:.2f}s",
            )

            self._emit_progress(
                "extraction_complete",
                {
                    "reviews_extracted": len(reviews_data),
                    "extraction_time": extraction_time,
                },
            )

            return reviews_data

        except JobCancelledException:
            raise
        except Exception as e:
            self.logger.error(f"Review extraction failed: {e}")
            raise RuntimeError(f"Failed to extract reviews: {e}")

    def _setup_review_extraction(self) -> None:
        """Setup the page for review extraction (sorting, etc.)"""
        try:
            time.sleep(2)

            # Click sort button
            sort_button = self.driver.find_element(
                By.XPATH,
                "//div[contains(@class, 'm6QErb') and contains(@class, 'Pf6ghf') and contains(@class, 'XiKgde') and contains(@class, 'KoSBEe') and contains(@class, 'ecceSd') and contains(@class, 'tLjsW')]/div[2]//button",
            )
            sort_button.click()
            self.logger.info("Clicked sort reviews button")

            # Select newest reviews
            newest_option, _ = self._get_element_(
                '//*[@id="action-menu"]/div[2]',
                By.XPATH,
                operation="select newest reviews",
            )
            newest_option.click()
            self.logger.info("Selected newest reviews sorting")

            time.sleep(2)

        except Exception as e:
            self.logger.warning(f"Could not setup review sorting: {e}")

    def _get_scrollable_container(self) -> WebElement:
        """Get the scrollable container for reviews"""
        targets = [
            (
                "//*[contains(@class, 'm6QErb') and contains(@class, 'DxyBCb') and contains(@class, 'kA9KIf') and contains(@class, 'dS8AEf') and contains(@class, 'XiKgde')][.//*[contains(@class, 'jANrlb')]]",
                By.XPATH,
            ),
            # (
            #     '//*[@id="QA0Szd"]/div/div/div[1]/div[3]/div/div[1]/div/div/div[3]',
            #     By.XPATH,
            # ),
            # (
            #     '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]',
            #     By.XPATH,
            # ),
        ]
        try:
            scrollable_container, selector_idx = self._get_element_(
                targets,
                operation="get scrollable container",
            )
            return scrollable_container
        except TimeoutException:
            self.logger.error("Scrollable container not found")
            raise RuntimeError("Could not find scrollable container for reviews")

    def _extract_reviews_with_retries(
        self,
        total_reviews: int,
        scrollable_div: WebElement,
    ) -> list[dict[str, Any]]:
        """Extract reviews with retry logic"""
        max_retries = 3
        report_interval = 10  # Report progress every 10 reviews

        is_hotel = self._check_if_hotel()

        for attempt in range(max_retries):
            try:
                self.logger.info(
                    f"Review extraction attempt {attempt + 1}/{max_retries}",
                )

                reviews_data = []
                current_seen_reviews = 0
                last_progress_report = 0

                while current_seen_reviews < total_reviews:
                    # Get current reviews
                    reviews, _ = self._get_element_(
                        target="jJc9Ad",
                        type_=By.CLASS_NAME,
                        multiple=True,
                        operation="get review elements",
                    )

                    # Extract new reviews
                    for i in range(current_seen_reviews + 1, len(reviews) + 1):
                        review_element, _ = self._get_element_(
                            f"(//*[contains(@class, 'jJc9Ad')])[{i}]",
                            type_=By.XPATH,
                            operation=f"get review {i}",
                        )
                        if is_hotel:
                            result = self._extract_review_hotel_(
                                review_element,
                                concat_extra=self.config.concat_extra,
                            )
                        else:
                            result = self._extract_review_(
                                review_element,
                                concat_extra=self.config.concat_extra,
                            )
                        reviews_data.append(result)

                    current_seen_reviews = len(reviews_data)

                    # Report progress every 10 reviews or significant milestones
                    if (
                        current_seen_reviews - last_progress_report >= report_interval
                        or current_seen_reviews >= total_reviews
                    ):
                        progress_percent = (current_seen_reviews / total_reviews) * 100
                        self.logger.info(
                            f"Progress: {current_seen_reviews}/{total_reviews} ({progress_percent:.1f}%)",
                        )

                        self._emit_progress(
                            "extraction_progress",
                            {
                                "current_reviews": current_seen_reviews,
                                "total_reviews": total_reviews,
                                "progress_percent": progress_percent,
                            },
                        )

                        last_progress_report = current_seen_reviews

                    # Scroll to load more reviews
                    self.driver.execute_script(
                        "arguments[0].scrollTop = arguments[0].scrollHeight",
                        scrollable_div,
                    )

                if len(reviews_data) == total_reviews:
                    return reviews_data
            except JobCancelledException:
                raise    
            except (StaleElementReferenceException, TimeoutException) as e:
                self.logger.warning(f"Extraction attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Wait before retry
                    continue
                raise RuntimeError(
                    f"Failed to extract reviews after {max_retries} attempts: {e}",
                )

        raise RuntimeError(
            f"Unable to extract all reviews after {max_retries} attempts",
        )

    def save_data(
        self,
        data: list[dict[str, Any]],
        path: str = "data",
        name: str = "",
        timestamp: bool = True,
    ) -> None:
        """Save extracted data to file"""
        try:
            if not os.path.exists(path):
                os.makedirs(path)

            if timestamp:
                name = f"{name}_{self.now}"

            save_start = time.time()

            if self.config.concat_extra:
                df = pd.DataFrame(data)
                filepath = f"{path}/{name}.csv"
                df.to_csv(filepath, index=False)
            else:
                filepath = f"{path}/{name}.json"
                with open(filepath, "w") as f:
                    json.dump(data, f, indent=2)

            save_time = time.time() - save_start
            self.logger.info(f"Data saved to {filepath} (took {save_time:.2f}s)")

        except Exception as e:
            self.logger.error(f"Failed to save data: {e}")
            raise RuntimeError(f"Data saving failed: {e}")

    def scrap(self, url: str) -> list[dict[str, Any]] | None:
        """Main scraping method with comprehensive logging and progress tracking.

        Args:
            url: Google Maps URL to scrape

        Returns:
            List of review data or None if no reviews found

        """
        try:
            self.logger.info(f"Starting scraping job for URL: {url}")
            self._emit_progress("scraping_start", {"url": url})            
            scraping_start = time.time()
            # Connect and get total reviews
            total_reviews = self.connect(url)

            if total_reviews == 0:
                self.logger.warning("No reviews found for this location")
                self._emit_progress(
                    "scraping_complete",
                    {
                        "status": "no_reviews",
                        "total_reviews": 0,
                        "reviews_extracted": 0,
                    },
                )
                return None

            # Extract review data
            data = self.extract_data(total_reviews)

            scraping_time = time.time() - scraping_start

            self.logger.info(
                f"Scraping completed successfully: {len(data)} reviews in {scraping_time:.2f}s",
            )
            self._emit_progress(
                "scraping_complete",
                {
                    "status": "success",
                    "total_reviews": total_reviews,
                    "reviews_extracted": len(data),
                    "scraping_time": scraping_time,
                },
            )

            return data
        
        except JobCancelledException:
            raise
        except Exception as e:
            scraping_time = time.time() - scraping_start
            self.logger.error(f"Scraping failed after {scraping_time:.2f}s: {e}")
            self._emit_progress(
                "scraping_failed",
                {"error": str(e), "scraping_time": scraping_time},
            )
            raise

    def _get_element_(
        self,
        target: str | list[tuple[str, By]],
        type_: By | None = None,
        source: WebElement | None = None,
        multiple: bool = False,
        operation: str = "unknown",
    ) -> tuple[WebElement | list[WebElement], int]:
        """Enhanced element finder with selector fallback.

        Args:
            target: Element selector(s) - can be:
                   - string (with type_ parameter) - OLD WAY
                   - list of (selector, By_type) tuples for fallback - NEW WAY
            type_: By type (used when target is string)
            source: Source element to search within
            multiple: Whether to find multiple elements
            operation: Description of the operation for logging

        Returns:
            tuple: (WebElement(s), selector_index_used)

        """
        # Normalize input to list of (selector, type) tuples
        if isinstance(target, str):
            if type_ is None:
                raise ValueError("type_ must be provided when target is a string")
            selectors = [(target, type_)]
        else:
            selectors = target

        condition = (
            EC.visibility_of_all_elements_located
            if multiple
            else EC.visibility_of_element_located
        )

        wait_obj = (
            WebDriverWait(
                driver=source,
                ignored_exceptions=ignored_exceptions,
                timeout=self.config.timeout,
            )
            if source
            else self.wait
        )

        # Try each selector once
        last_exception = None

        for selector_idx, (selector, selector_type) in enumerate(selectors):
            try:
                self.logger.debug(
                    f"Trying selector {selector_idx + 1}/{len(selectors)} for operation: {operation}",
                )

                elements = wait_obj.until(condition((selector_type, selector)))

                if multiple:
                    self.logger.debug(
                        f"Found {len(elements)} elements with selector {selector_idx + 1} for operation: {operation}",
                    )
                else:
                    self.logger.debug(
                        f"Found element with selector {selector_idx + 1} for operation: {operation}",
                    )

                return elements, selector_idx

            except (TimeoutException, NoSuchElementException) as e:
                last_exception = e
                selector_name = getattr(selector_type, "name", str(selector_type))
                self.logger.debug(
                    f"Selector {selector_idx + 1} failed: {selector_name}='{selector}'",
                )

            except Exception as e:
                last_exception = e
                self.logger.warning(
                    f"Unexpected error with selector {selector_idx + 1}: {e}",
                )

        # All selectors failed
        error_msg = f"All selectors failed for operation '{operation}'"
        self.logger.error(error_msg)
        if last_exception:
            raise type(last_exception)(f"{error_msg}. Last error: {last_exception}")
        raise TimeoutException(error_msg)

    def exit(self, force: bool = False) -> None:
        """Clean browser shutdown with proper resource cleanup"""
        try:
            self.logger.info("Shutting down scraper...")

            if not force and not self.config.headless:
                _ = input("Press Enter to close the browser...")

            if hasattr(self, "driver"):
                self.driver.quit()
                self.logger.info("Browser closed successfully")

        except Exception as e:
            self.logger.warning(f"Error during shutdown: {e}")
        finally:
            total_time = time.time() - self.start_time
            self.logger.info(f"Scraper session ended (total time: {total_time:.2f}s)")

    def _extract_review_(
        self,
        review_container: WebElement,
        concat_extra: bool = False,
    ) -> dict[str, Any]:
        """Extract individual review data with improved error handling"""
        review = {}

        try:
            # Get username
            review["username"] = review_container.find_element(
                By.CLASS_NAME,
                "d4r55",
            ).text

            # Get rating
            try:
                stars = review_container.find_elements(
                    By.XPATH,
                    ".//span[contains(@class, 'hCCjke') and contains(@class, 'elGi1d')]",
                )
                review["rating"] = len(stars)
            except NoSuchElementException:
                rating_text = review_container.find_element(
                    By.CLASS_NAME,
                    "fzvQIb",
                ).text
                review["rating"] = int(rating_text.split("/")[0])

            # Get date
            date_text = review_container.find_element(By.CLASS_NAME, "rsqaWe").text
            review["date"] = parse_relative_date(date_text)

            # Get likes (optional)
            try:
                review["likes"] = review_container.find_element(
                    By.CLASS_NAME,
                    "pkWtMe",
                ).text
            except NoSuchElementException:
                review["likes"] = 0

            # Get translated text
            try:
                comment_section = review_container.find_element(By.CLASS_NAME, "MyEned")
                try:
                    # Try to expand "more" button
                    comment_section.find_element(By.TAG_NAME, "button").click()
                except NoSuchElementException:
                    pass
                review["translated_text"] = comment_section.find_element(
                    By.CLASS_NAME,
                    "wiI7pd",
                ).text
            except NoSuchElementException:
                review["translated_text"] = None

            # Extract extra attributes
            self._extract_extra_attributes(review_container, review, concat_extra)

            # Get original text if enabled
            if self.config.original:
                self._extract_original_text(review_container, review)

            return review

        except Exception as e:
            self.logger.warning(f"Failed to extract review data: {e}")
            return {"error": f"Extraction failed: {e}"}

    def _extract_review_hotel_(
        self,
        review_container: WebElement,
        concat_extra: bool = False,
    ) -> dict[str, Any]:
        """Extract individual review data for hotel listing"""
        review = {}

        try:
            # Get username
            review["username"] = review_container.find_element(
                By.CLASS_NAME,
                "d4r55",
            ).text

            # Get rating
            try:
                rating_text = review_container.find_element(
                    By.CLASS_NAME,
                    "fzvQIb",
                ).text
                review["rating"] = int(rating_text.split("/")[0])
            except NoSuchElementException:
                stars = review_container.find_elements(
                    By.XPATH,
                    ".//span[contains(@class, 'hCCjke') and contains(@class, 'elGi1d')]",
                )
                review["rating"] = len(stars)

            # Get date
            try:
                date_text = review_container.find_element(
                    By.CLASS_NAME,
                    "xRkPPb",
                ).text.split("\n")[0]
                review["date"] = parse_relative_date(date_text)
            except NoSuchElementException as e:
                raise ValueError("Could not find date element in hotel review") from e

            # Get likes (optional)
            try:
                review["likes"] = review_container.find_element(
                    By.CLASS_NAME,
                    "pkWtMe",
                ).text
            except NoSuchElementException:
                review["likes"] = 0

            # Get translated text
            try:
                comment_section = review_container.find_element(By.CLASS_NAME, "MyEned")
                try:
                    # Try to expand "more" button
                    comment_section.find_element(By.TAG_NAME, "button").click()
                except NoSuchElementException:
                    pass
                review["translated_text"] = comment_section.find_element(
                    By.CLASS_NAME,
                    "wiI7pd",
                ).text
            except NoSuchElementException:
                review["translated_text"] = None

            # Extract extra attributes
            self._extract_extra_attributes(review_container, review, concat_extra)

            # Get original text if enabled
            if self.config.original:
                self._extract_original_text(review_container, review)

            return review

        except Exception as e:
            self.logger.warning(f"Failed to extract review data: {e}")
            return {"error": f"Extraction failed: {e}"}

    def _extract_extra_attributes(
        self,
        review_container: WebElement,
        review: dict[str, Any],
        concat_extra: bool,
    ) -> None:
        """Extract extra review attributes"""
        if concat_extra:
            review["extra"] = ""

        try:
            extra = review_container.find_element(
                By.CSS_SELECTOR,
                "div[jslog='127691']",
            )
            extras = extra.find_elements(By.CLASS_NAME, "PBK6be")

            for extra_item in extras:
                spans = extra_item.find_elements(By.CLASS_NAME, "RfDO5c")

                if len(spans) == 2:
                    key, value = spans[0].text, spans[1].text
                elif len(spans) == 1:
                    txt = (
                        spans[0]
                        .text.replace("<b>", "")
                        .replace("</b>", "")
                        .replace('"', "")
                        .replace(" ", "")
                    )
                    try:
                        key, value = txt.split(":", 1)
                    except ValueError:
                        self.logger.warning(f"Could not parse extra attribute: '{txt}'")
                        continue
                else:
                    continue

                if concat_extra:
                    review["extra"] += (
                        f",{key}:{value}" if review["extra"] else f"{key}:{value}"
                    )
                else:
                    review[key] = value

        except NoSuchElementException:
            pass  # No extra attributes found

    def _extract_original_text(
        self,
        review_container: WebElement,
        review: dict[str, Any],
    ) -> None:
        """Extract original language text if available"""
        try:
            translate_button = review_container.find_element(
                By.CLASS_NAME,
                "oqftme",
            ).find_element(By.TAG_NAME, "button")
            translate_button.click()
            time.sleep(0.5)  # Wait for translation

            comment_section = review_container.find_element(By.CLASS_NAME, "MyEned")
            review["original_text"] = comment_section.find_element(
                By.CLASS_NAME,
                "wiI7pd",
            ).text
        except NoSuchElementException:
            review["original_text"] = review.get("translated_text")

    def reset(self) -> None:
        """Reset scraper to initial state"""
        try:
            self.logger.info("Resetting scraper state...")

            self.driver.get(MAPS_LINK)
            self.accept_cookies()
            self.now = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            self.start_time = time.time()

            self.logger.info(f"Scraper reset completed at {self.now}")

        except Exception as e:
            self.logger.error(f"Reset failed: {e}")
            raise RuntimeError(f"Scraper reset failed: {e}")
