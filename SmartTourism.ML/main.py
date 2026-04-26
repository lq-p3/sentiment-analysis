# AI Server -- Scrapes Google Maps reviews and runs sentiment analysis
import time
import re
import pandas as pd
from typing import List, Dict, Optional, Tuple
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from contextlib import asynccontextmanager

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

from transformers import pipeline

# Global variable for the sentiment model
clf = None

# ===== Request / Response schemas =====

class AnalyzeRequest(BaseModel):
    place_name: str
    max_reviews: int = 150
    lang: str = "ar"

class ReviewData(BaseModel):
    source: str
    text: str
    language: str
    rating: Optional[float]
    place_id: str
    predicted_label: str   # Positive / Negative / Neutral
    score: float           # Confidence score 0-1
    keywords: List[str]
    original_date: Optional[str]

class AnalyzeResponse(BaseModel):
    reviews: List[ReviewData]

# ===== Text Preprocessing =====

# Match URLs (e.g. https://example.com)
URL_RE = re.compile(r"(https?://\S+|www\.\S+)", re.IGNORECASE)

# Match multiple whitespace characters (spaces, tabs, newlines)
MULTI_SPACE_RE = re.compile(r"\s+")

# Match الكشيدة (tatweel ـــ) - used for stretching Arabic words visually
KASHIDA_RE = re.compile(r"\u0640+")

# Match التشكيل (الفتحة، الضمة، الكسرة، السكون، الشدة، التنوين)
TASHKEEL_RE = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]")

# Match repeated characters 3+ times (e.g. "جميييييل" or "روووعة")
REPEATED_CHAR_RE = re.compile(r"(.)\1{2,}")


def normalize_arabic_light(text: str) -> str:
    """
    Light normalization for Arabic text:
    - Remove التشكيل (diacritics)
    - Remove الكشيدة (tatweel)
    - Unify أ/إ/آ into ا (all hamza forms become plain alef)
    - Unify ى into ي (alef maqsura becomes ya)
    """

    # Remove التشكيل like الفتحة (َ) والضمة (ُ) والكسرة (ِ) والشدة (ّ) والسكون (ْ)
    text = TASHKEEL_RE.sub("", text)

    # Remove الكشيدة (ـ) used to stretch words like "مطعـــم"
    text = KASHIDA_RE.sub("", text)

    # Unify همزة الألف: أ، إ، آ all become ا
    text = text.replace("\u0623", "\u0627").replace("\u0625", "\u0627").replace("\u0622", "\u0627")

    # Unify الألف المقصورة: ى becomes ي
    text = text.replace("\u0649", "\u064a")

    return text


def preprocess_for_camelbert(text: str) -> str:
    """
    Clean a Google Maps review text before passing it to CAMeLBERT.
    Keeps emojis (useful sentiment signals) and removes noise.
    """

    # Make sure input is a string
    text = str(text)

    # Remove any URLs that may appear in reviews
    text = URL_RE.sub(" ", text)

    # Apply Arabic character normalization (التشكيل، الكشيدة، توحيد الهمزات)
    text = normalize_arabic_light(text)

    # Reduce repeated characters to max 2 (e.g. "جميييييل" becomes "جمييل", "روووعة" becomes "روعة")
    text = REPEATED_CHAR_RE.sub(r"\1\1", text)

    # Collapse multiple spaces into one and strip edges
    text = MULTI_SPACE_RE.sub(" ", text).strip()

    return text


def clean_review_for_model(text: str, min_len: int = 10) -> Tuple[Optional[str], Optional[str]]:
    """
    Full cleaning pipeline for a single review.

    Returns:
        (cleaned_text, None)   if the review is valid.
        (None, reject_reason)  if rejected.
    """

    # Reject empty or whitespace-only reviews
    if not text or not str(text).strip():
        return None, "empty_text"

    # Run the preprocessing pipeline
    cleaned = preprocess_for_camelbert(text)

    # Reject if nothing remains after cleaning
    if not cleaned:
        return None, "empty_after_cleaning"

    # Reject reviews that are too short to carry meaningful sentiment
    if len(cleaned) < min_len:
        return None, "too_short"

    return cleaned, None


def extract_keywords(text: str) -> List[str]:
    """Extract up to 4 meaningful keywords from cleaned text."""

    # Arabic stop words (حروف الجر والعطف وكلمات شائعة لا تحمل معنى)
    stop_words = {
        "\u0641\u064a", "\u0645\u0646", "\u0639\u0644\u0649",       # في، من، على
        "\u0625\u0644\u0649", "\u0639\u0646", "\u0645\u0639",       # إلى، عن، مع
        "\u0647\u0630\u0627", "\u0647\u0630\u0647",                 # هذا، هذه
        "\u0643\u0627\u0646", "\u0643\u0627\u0646\u062a",           # كان، كانت
        "\u0648", "\u0623\u0648", "\u0648\u0644\u0643\u0646",       # و، أو، ولكن
        "\u0623\u064a\u0636\u0627",                                 # أيضا
    }

    # Split text into individual words
    words = text.split()

    # Keep only words longer than 3 characters that are not stop words
    valid = [w for w in words if len(w) > 3 and w not in stop_words]

    # Return the first 4 keywords
    return valid[:4]


# ===== Google Maps Review Scraper =====

def build_driver(lang="ar"):
    """Create a headless Chrome driver with anti-detection settings."""
    opts = Options()
    opts.add_argument("--headless")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-blink-features=AutomationControlled")

    chrome_lang = "ar" if lang == "ar" else "en-US"
    opts.add_argument(f"--lang={chrome_lang}")
    opts.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
    )
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"
    })
    return driver


def get_stars(el) -> Optional[float]:
    """Extract the star rating (1-5) from a review card element."""
    for sel in ["span[role='img']", "span.kvMYJc", "span.hh2c6"]:
        try:
            for node in el.find_elements(By.CSS_SELECTOR, sel):
                aria = node.get_attribute("aria-label") or ""
                m = re.search(r"(\d+)", aria)
                if m and 1 <= int(m.group(1)) <= 5:
                    return float(m.group(1))
        except Exception:
            pass
    return None


def get_text(el):
    """Extract the review text from a review card element."""
    for sel in ["span.wiI7pd", "span.MyEned", "div.MyEned"]:
        try:
            t = el.find_element(By.CSS_SELECTOR, sel).text.strip()
            if len(t) > 5:
                return t
        except Exception:
            pass
    return ""


def get_panel(driver):
    """Locate the scrollable reviews panel element."""
    try:
        panel = driver.execute_script("""
            var cards = document.querySelectorAll('div.jftiEf, div[data-review-id]');
            if (!cards.length) return null;
            var el = cards[0];
            for (var i = 0; i < 15; i++) {
                el = el.parentElement;
                if (!el) break;
                var st = window.getComputedStyle(el);
                var ov = st.overflowY + ' ' + st.overflow;
                if ((ov.includes('auto') || ov.includes('scroll'))
                    && el.scrollHeight > el.clientHeight + 50)
                    return el;
            }
            return null;
        """)
        if panel:
            return panel
    except Exception:
        pass
    return None


def scroll_step(driver, panel):
    """Perform multiple fast scrolls to load more review cards."""
    for _ in range(5):
        if panel:
            try:
                driver.execute_script("arguments[0].scrollTop += 3000;", panel)
            except Exception:
                pass
        time.sleep(0.5)


def scrape_reviews(place_name: str, max_reviews: int = 150, lang: str = "ar"):
    """
    Scrape reviews from a Google Maps place page.

    Args:
        place_name:  Name of the place to search for.
        max_reviews: Maximum number of reviews to collect.
        lang:        Language code ('ar' for Arabic).

    Returns:
        List of dicts with 'text' and 'rating' keys.
    """
    driver = build_driver(lang=lang)
    all_collected = []
    seen = set()

    try:
        # Search for the place
        hl = "ar" if lang == "ar" else "en"
        search_url = (
            "https://www.google.com/maps/search/"
            + place_name.replace(" ", "+") + f"?hl={hl}"
        )
        driver.get(search_url)
        time.sleep(3)

        # If a list appears, click the first result
        place_url = None
        if "/maps/place/" in driver.current_url:
            place_url = driver.current_url
        else:
            try:
                links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/maps/place/']")
                if links:
                    place_url = links[0].get_attribute("href")
            except Exception:
                pass

        if place_url:
            reviews_url = place_url.split("?")[0] + f"?hl={hl}"
            driver.get(reviews_url)
            time.sleep(3)

        # Click the Reviews tab
        all_els = (
            driver.find_elements(By.CSS_SELECTOR, "button")
            + driver.find_elements(By.CSS_SELECTOR, "[role='tab']")
        )
        MATCH = [
            "reviews",
            "\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0627\u062a",
            "\u0645\u0631\u0627\u062c\u0639\u0627\u062a",
            "\u062a\u0642\u064a\u064a\u0645\u0627\u062a",
        ]
        SKIP = ["write", "\u0643\u062a\u0627\u0628\u0629", "add"]

        for el in all_els:
            txt = (el.text or "").strip()
            aria = (el.get_attribute("aria-label") or "").strip()
            combined = (txt + " " + aria).lower()
            if any(s in combined for s in SKIP):
                continue
            if any(m in combined for m in MATCH):
                driver.execute_script("arguments[0].click();", el)
                time.sleep(2)
                break

        panel = get_panel(driver)
        stale = 0
        last_total = 0

        # Scroll and collect reviews
        while len(all_collected) < max_reviews:
            scroll_step(driver, panel)

            cards = driver.find_elements(
                By.CSS_SELECTOR, "div.jftiEf, div[data-review-id]"
            )
            for card in cards:
                if len(all_collected) >= max_reviews:
                    break
                uid = card.get_attribute("data-review-id") or str(id(card))
                if uid in seen:
                    continue
                seen.add(uid)

                text = get_text(card)
                if not text:
                    continue
                stars = get_stars(card)

                all_collected.append({"text": text, "rating": stars})

            total = len(all_collected)
            if total > last_total:
                stale = 0
                last_total = total
            else:
                stale += 1
                if stale >= 10:
                    break
    finally:
        driver.quit()

    return all_collected


# ===== FastAPI Server =====

@asynccontextmanager
async def lifespan(app: FastAPI):
    global clf
    print("Loading CAMeLBERT model...")
    MODEL_NAME = "CAMeL-Lab/bert-base-arabic-camelbert-da-sentiment"
    clf = pipeline(task="sentiment-analysis", model=MODEL_NAME)
    print("Model loaded successfully.")
    yield

app = FastAPI(lifespan=lifespan)


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """Accept a place name, scrape its reviews, and return analyzed results."""
    if not clf:
        raise HTTPException(status_code=500, detail="Model not loaded yet.")

    print(f"Scraping {req.place_name} for {req.max_reviews} reviews...")
    raw_data = scrape_reviews(req.place_name, max_reviews=req.max_reviews, lang=req.lang)

    results = []

    for idx, item in enumerate(raw_data):
        raw_text = item["text"]
        rating = item["rating"]

        # Clean the review text
        cleaned_text, reason = clean_review_for_model(raw_text)
        if not cleaned_text:
            continue

        # Run CAMeLBERT sentiment prediction
        pred = clf(cleaned_text, truncation=True, max_length=512)[0]
        label = pred["label"].capitalize()
        if label == "Mixed":
            label = "Neutral"

        score = pred["score"]

        results.append(ReviewData(
            source="Google Maps",
            text=raw_text,
            language=req.lang,
            rating=rating,
            place_id=f"place_{req.place_name.lower().replace(' ', '_')}_{idx}",
            predicted_label=label,
            score=round(score, 3),
            keywords=extract_keywords(cleaned_text),
            original_date=None,
        ))

    return AnalyzeResponse(reviews=results)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
