from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    StaleElementReferenceException,
)
import random
import re
import datetime
import time
import pandas as pd
import os
import json
import logging
import argparse
import undetected_chromedriver as uc

# import types for type hinting
from selenium.webdriver.remote.webelement import WebElement

ignored_exceptions = (
    NoSuchElementException,
    StaleElementReferenceException,
)

NOW = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
# DATA_PATH = "data"
MAPS_LINK = "https://www.google.com/maps"



script_dir = os.path.dirname(os.path.abspath(__file__))
scraper_dir = os.path.dirname(script_dir)
chromedriver_path = os.path.join(scraper_dir, "Driver", "chromedriver")



# go to parent directory
os.chdir(os.path.dirname(os.getcwd()))


def convert_to_google_com(url):
    """
    Convert any Google Maps URL to use google.com domain.
    
    Args:
        url (str): The original Google Maps URL with any domain
        
    Returns:
        str: The same URL but with google.com domain
    """
    # Pattern to match google.XX or maps.google.XX in the URL
    pattern = r'(https?://)(?:www\.)?(google\.|maps\.google\.)[a-z]{2,}(\.[a-z]{2,})?(\/)'
    
    # Replace with google.com
    converted_url = re.sub(pattern, r'\1\2com\4', url)
    
    return converted_url


def get_arguments():
    def str2bool(v):
        if isinstance(v, bool):
            return v
        if v.lower() in ("yes", "true", "t", "y", "1"):
            return True
        elif v.lower() in ("no", "false", "f", "n", "0"):
            return False
        else:
            raise argparse.ArgumentTypeError("Boolean value expected.")

    # read arguments from the command line
    parser = argparse.ArgumentParser(description="Google Maps Review Scraper")
    parser.add_argument(
        "--driver",
        type=str,
        default=chromedriver_path,
        help="Path to the Chrome driver",
    )
    parser.add_argument("--url", type=str, help="URL of the Google Maps reviews")
    parser.add_argument(
        "--headless",
        type=str2bool,
        default=True,
        help="Run the browser in headless mode, default is True",
    )
    parser.add_argument(
        "--verbose", type=str2bool, default=False, help="Verbose mode, default is False"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=5,
        help="timeout for the driver, in seconds, default is 10s",
    )
    parser.add_argument(
        "--original",
        type=str2bool,
        default=True,
        help="Get the comment in the original language, default is True",
    )
    parser.add_argument(
        "--language",
        type=str,
        default="en",
        help="Language for the reviews, default is English",
    )
    parser.add_argument(
        "--concat_extra",
        type=str2bool,
        default=False,
        help="Concatenate extra attributes in a single column, default is False",
    )
    parser.add_argument(
        "--path",
        type=str,
        default="data",
        help="Path to save the data, default is data",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="reviews",
        help="Name of the file to save the data, default is 'reviews'",
    )
    parser.add_argument(
        "--timestamp",
        type=str2bool,
        default=True,
        help="Add timestamp to the file name, default is True",
    )
    parser.add_argument(
        "--log_file",
        type=str,
        default=None,
        help="Name of the log file, default is None, show logs in command line",
    )
    return parser.parse_args()


class GoogleMapsReviewScraper:
    """
    A class to scrape Google Maps reviews for a given location.
    """

    accepted_languages = ["en", "fr", "de", "es", "it", "nl", "ja", "pt", "ru", "zh-CN"]

    def __init__(
        self,
        headless=True,
        verbose=False,
        timeout=10,
        original=True,
        language="en",
        concat_extra=False,
        log_file=None,
        extra_headers=[],
    ):
        

        # todo: make sure the URL is a valid Google Maps reviews link
        options = webdriver.ChromeOptions()
        self.now = NOW
        self.headless = headless
        self.original = original
        self.concat_extra = concat_extra
        self.log_file = log_file
        self.timeout = timeout
        self.language = language
        self.cookies_accepted = False
        # check if the language is accepted
        if language not in self.accepted_languages:
            raise ValueError(f"Language {language} is not accepted.")

        level = logging.INFO if verbose else logging.ERROR

        if self.log_file:
            logging.basicConfig(filename=f"logs/{log_file}_{NOW}.log", level=level)
        else:
            logging.basicConfig(level=level)

        options = uc.ChromeOptions()
        options.arguments.extend(["--no-sandbox", "--disable-setuid-sandbox"]) 
        self.driver = uc.Chrome(headless=False, use_subprocess=False, options=options)
        logging.info("driver started")

        # set the delay for the driver
        self.wait = WebDriverWait(
            driver=self.driver, ignored_exceptions=ignored_exceptions, timeout=timeout
        )
        
        # connect to google maps and accept the cookies
        try:

            self.driver.get(MAPS_LINK)
            time.sleep(random.uniform(8, 10))
            # take a screenshot of the page
            
            self.accept_cookies()
        except Exception as e:
            logging.error(f"Error connecting to {MAPS_LINK}")
            raise e
        
    def accept_cookies(self):
        # wait for the page to load and get cookies accept button
        accept_button = self._get_element_(
            "//*[@id='yDmH0d']/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/div[1]/form[2]/div/div/button",
            type_=By.XPATH,
        )
        # Add wait time
        time.sleep(0.5)
        accept_button.click()
        time.sleep(0.5)
        
        logging.info("Clicked on accept cookies button")
        self.driver.save_screenshot(f"cookies_accepted_check.png")
        logging.info("Clicked on accept cookies button")
    
        # check if the cookie banner is still visible
        try:
            cookie_banner = self.driver.find_element(By.XPATH, "//*[@id='yDmH0d']/c-wiz/div/div/div/div[2]/div[1]")
            if cookie_banner.is_displayed():
                time.sleep(2)
                # If still visible, try clicking again
                logging.info("Cookie banner still visible, trying again")
                accept_button = self._get_element_(
                    "//*[@id='yDmH0d']/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/div[1]/form[2]/div/div/button",
                    type_=By.XPATH,
                )
                accept_button.click()
                
        except:
            logging.info("Cookies accepted")
            self.cookies_accepted = True
            
        # take a screenshot of the page after accepting cookies
        self.driver.save_screenshot(f"cookies_accepted.png")

        

    def connect(self, url):
        
        
        url = f"{url}&hl={self.language}"
        # ww.google.anything => ww.google.com
        url = convert_to_google_com(url)
        # remove spaces and new lines from the URL
        #url = re.sub(r"\s+", "", url)
        
        
        logging.info(f"Connecting to target url")
        self.driver.save_screenshot(f"main_google.png")
        logging.info(f"Connecting to target url 2")
        

        try:
            self.driver.get(url)   
            logging.info(f"Connected to target page! ")
            self.driver.save_screenshot(f"target_page_.png")
            logging.info(f"Connected to target page! 2 ")
            if not self.cookies_accepted:                     
                self.accept_cookies()         
                   
            try:
                _ = self._get_element_('A1zNzb',By.CLASS_NAME)
                hotel = True
            except Exception as e:
                hotel = False
                logging.error(f"Error checking if hotel: {e}")

                
            logging.info(f"is hotel: {hotel}")
                
            if hotel:
                path = '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[4]/div[1]/div/div[2]/div[3]'
            else:
                #'//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div[1]/div/div[2]/div[3]'
                path = "//div[contains(@class, 'jANrlb')]/div[3]"
            
    
            logging.info(f"getting total reviews ... ")
            total_reviews = self._get_element_(path, type_=By.XPATH).text
            total_reviews = int(re.sub(r"\D", "", total_reviews))
            logging.info(f"Total reviews: {total_reviews}")
            return total_reviews


        except Exception as e:
            logging.error(f"Error in connect method: {e}")
            raise e

    def extract_data(self, total_reviews):
        

        time.sleep(2)
        
        # with open("debug_page.html", "w", encoding="utf-8") as f:
        #     f.write(self.driver.page_source)
        
        self.driver.find_element(By.XPATH, "//div[contains(@class, 'm6QErb') and contains(@class, 'Pf6ghf') and contains(@class, 'XiKgde') and contains(@class, 'KoSBEe') and contains(@class, 'ecceSd') and contains(@class, 'tLjsW')]/div[2]//button").click()
        logging.info("Clicked on sort reviews button")
        _ = self._get_element_('//*[@id="action-menu"]/div[2]', By.XPATH).click()
        logging.info("Clicked on newest reviews option")
        
        time.sleep(2)

        try:
            scrollable_div = self._get_element_('//*[@id="QA0Szd"]/div/div/div[1]/div[3]/div/div[1]/div/div/div[3]', By.XPATH)
        except TimeoutException:
            scrollable_div = self._get_element_('//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]', By.XPATH)
            
        nb_tries = 0
        while nb_tries < 3:
            try:
                current_seen_reviews = 0
                reviews_data = []
                # to avoid the StaleElementReferenceException error
                time.sleep(0.5)
                while current_seen_reviews < total_reviews:
                    # get new reviews
                    reviews = self._get_element_(
                        target="jJc9Ad", type_=By.CLASS_NAME, multiple=True
                    )

                    for i in range(current_seen_reviews + 1, len(reviews) + 1):
                        review = self._get_element_(
                            f"(//*[contains(@class, 'jJc9Ad')])[{i}]",
                            type_=By.XPATH,
                            multiple=False,
                        )
                        result = self._extract_review_(
                            review, concat_extra=self.concat_extra
                        )
                        reviews_data.append(result)
                    current_seen_reviews = len(reviews_data)
                    logging.info(
                        f"Extracted {current_seen_reviews} / {total_reviews}"
                    )
                    # scroll to load more reviews
                    self.driver.execute_script(
                        "arguments[0].scrollTop = arguments[0].scrollHeight",
                        scrollable_div,
                    )
                if len(reviews_data) == total_reviews:
                    return reviews_data

            except (StaleElementReferenceException, TimeoutException) as e:
                logging.error(f"TimeoutException: {e}")
                nb_tries += 1
                continue
            raise TimeoutException(
                "Unable to extract all reviews, max number of tries reached"
            )

    def save_data(self, data, path="data", name="", timestamp=True):
        if not os.path.exists(path):
            os.makedirs(path)

        if timestamp:
            name = f"{name}_{self.now}"

        if self.concat_extra:
            df = pd.DataFrame(data)
            df.to_csv(f"{path}/{name}.csv", index=False)
            logging.info(f"Data saved to {path}/{name}.csv")
        else:
            with open(f"{path}/{name}.json", "w") as f:
                json.dump(data, f)
            logging.info(f"Data saved to {path}/{name}.json")

    def scrap(self, url):
        logging.info(f"Scraping {url} ...")
        start = time.time()
        total_reviews = self.connect(url)
        logging.info(f"Connected, Total number of reviews: {total_reviews}")
        if total_reviews == 0:
            logging.warning("No reviews were found, returning None")
            return None

        data = self.extract_data(total_reviews)
        logging.info(f"Scraped {len(data)} reviews")
        end = time.time()
        logging.info(f"Scraping completed in {end - start} seconds")
        return data

    def _get_element_(self, target, type_, source=None, multiple=False):
        """
        Finds and returns a web element based on the given XPath.

        Args:
            driver: The WebDriver instance (e.g., Chrome, Firefox).
            xpath: The XPath string to locate the element.
            timeout: The maximum time to wait for the element (default is 10 seconds).

        Returns:
            WebElement: The located element.

        Raises:
            TimeoutException: If the element is not found within the timeout period.
        """

        condition = (
            EC.visibility_of_all_elements_located
            if multiple
            else EC.visibility_of_element_located
        )

        try:
            if source:
                elements = WebDriverWait(
                    driver=source,
                    ignored_exceptions=ignored_exceptions,
                    timeout=self.timeout,
                ).until(condition((type_, target)))
            else:
                elements = self.wait.until(condition((type_, target)))
            return elements
        except TimeoutException as e:
            logging.error(f"TimeoutException: Unable to locate element with {type_} : {target}")
            raise e
        except NoSuchElementException as e:
            logging.error(f"NoSuchElementException: Unable to locate element with {type_} : {target}")
            raise e
        except StaleElementReferenceException as e:
            logging.error(f"StaleElementReferenceException: Unable to locate element with {type_} : {target}")
            raise e
        except Exception as e:
            logging.error(f"Exception: No defined exception for {type_} : {target}")
            raise e

    def exit(self, force=False):
        """function to close the browser"""
        if force:
            self.driver.quit()
            return

        if not self.headless:
            _ = input("Type Anything to close the browser")
        self.driver.quit()

    def _extract_review_(
        self, review_container: WebElement, concat_extra: bool = False
    ) -> dict:
        review = {}
        # get username
        review["username"] = review_container.find_element(By.CLASS_NAME, "d4r55").text

        # get rating
        try:
            stars = review_container.find_elements(
                By.XPATH,
                ".//span[contains(@class, 'hCCjke') and contains(@class, 'elGi1d')]",
            )
            review["rating"] = len(stars)
        except NoSuchElementException:
            review["rating"] = int(review_container.find_element(By.CLASS_NAME, "fzvQIb").text.split("/")[0])
            print("name ", review["username"], " rating: ", review["rating"])

        # get date
        review["date"] = review_container.find_element(By.CLASS_NAME, "rsqaWe").text

        # check if has likes
        try:
            review["likes"] = review_container.find_element(By.CLASS_NAME, "pkWtMe").text
        except NoSuchElementException:
            review["likes"] = 0

        # get comment text
        try:
            comment_section = review_container.find_element(By.CLASS_NAME, "MyEned")
            try:
                comment_section.find_element(By.TAG_NAME, "button").click()
            except NoSuchElementException:
                pass
            review["comment"] = comment_section.find_element(By.CLASS_NAME, "wiI7pd").text
        except NoSuchElementException:
            review["comment"] = None

        # check for extra attributes
        if concat_extra:
            review["extra"] = ""
        try:
            extra = review_container.find_element(By.CSS_SELECTOR, "div[jslog='127691']")
            extras = extra.find_elements(By.CLASS_NAME, "PBK6be")
            for i in range(len(extras)):
                spans = extras[i].find_elements(By.CLASS_NAME, "RfDO5c")
                if len(spans) == 2:
                    key = spans[0].text
                    value = spans[1].text
                else:
                    txt = spans[0].text.replace('<b>', '').replace('</b>', '').replace('"', '').replace(' ', '')
                    try:    
                        key, value = txt.split(':')
                    except ValueError:
                        logging.warning(f"Unable to split extra attribute: '{txt}'")
                        continue
                if not concat_extra:
                    review[key] = value
                else:
                    review["extra"] += "," + f"{key}:{value}"
        except NoSuchElementException:
            pass

        if self.original:
            try:
                review_container.find_element(By.CLASS_NAME, "oqftme").find_element(By.TAG_NAME, "button").click()
                review["original"] = comment_section.find_element(By.CLASS_NAME, "wiI7pd").text
            except NoSuchElementException:
                review["original"] = review["comment"]

        return review

    def reset(self):
        self.driver.get(MAPS_LINK)
        self.accept_cookies()
        self.now = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        logging.info("Resetting the scraper at {}".format(self.now))


if __name__ == "__main__":
    args = get_arguments()
    
    print("starting scrapper")
    
    try:
        scrapper = GoogleMapsReviewScraper(
            driver_path=args.driver,
            headless=args.headless,
            verbose=args.verbose,
            timeout=args.timeout,
            original=args.original,
            language=args.language,
            concat_extra=args.concat_extra,
            log_file=args.log_file,
        )
        print(args.url)
        data = scrapper.scrap(args.url)
        scrapper.save_data(
            data=data, path=args.path, name=args.name, timestamp=args.timestamp
        )
    except Exception as e:
        logging.error(f"Error: {e}")
    finally:
        
        if 'scrapper' in locals():
            logging.info("Exiting the scraper")
            scrapper.exit(force=False)
