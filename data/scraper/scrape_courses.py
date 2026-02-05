#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "requests",
#     "beautifulsoup4",
# ]
# ///
"""
UNC Course Catalog Scraper
Scrapes course data from catalog.unc.edu and exports to JSON

Run with: uv run scrape_courses.py
"""

import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://catalog.unc.edu"
COURSES_URL = f"{BASE_URL}/courses/"

# Arts & Sciences departments to scrape (most common gen ed courses)
ARTS_SCIENCES_DEPTS = [
    "aaad", "amst", "anth", "arab", "arch", "arth", "arts", "asia", "astr",
    "biol", "chem", "chin", "clas", "clar", "comm", "cmpl", "comp", "data",
    "dram", "econ", "engl", "enec", "exss", "folk", "fren", "geog", "geol",
    "germ", "glbl", "grek", "hebr", "hist", "ital", "japn", "jwst", "kor",
    "latn", "lfit", "ling", "ltam", "math", "musc", "phil", "phys", "poli",
    "port", "psyc", "pwad", "reli", "roml", "russ", "soci", "span", "stor",
    "wgst"
]

# Gen ed code patterns
GENED_PATTERNS = [
    "FY-LAUNCH", "FY-SEMINAR", "FY-WRITING", "FY-DATA", "FY-THRIVE",
    "FC-AESTH", "FC-CREATE", "FC-PAST", "FC-VALUES", "FC-GLOBAL",
    "FC-NATSCI", "FC-POWER", "FC-QUANT", "FC-KNOWING", "FC-LAB",
    "GLBL-LANG", "RESEARCH", "HIGH-IMPACT", "COMMBEYOND", "INTERDISC",
    "LIFE-FIT", "CAMPUS-LIFE", "AMER-DEM"
]


def get_soup(url: str) -> BeautifulSoup:
    """Fetch URL and return BeautifulSoup object"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


def extract_geneds(text: str) -> list:
    """Extract gen ed codes from text"""
    geneds = []
    for pattern in GENED_PATTERNS:
        if pattern in text.upper():
            geneds.append(pattern)
    return geneds


def parse_course_block(block) -> dict | None:
    """Parse a single course block and return course data"""
    try:
        # Get full block text (normalized)
        full_text = block.get_text()
        # Replace non-breaking spaces and normalize whitespace
        full_text = full_text.replace('\xa0', ' ')
        full_text = re.sub(r'\s+', ' ', full_text).strip()

        # Parse course code, title, and credits
        # Format: "DEPT 123. Title. 3 Credits."
        match = re.match(
            r"([A-Z]+)\s+(\d+[A-Z]?)\.\s*(.+?)\.\s*(\d+(?:-\d+)?)\s*Credits?\.",
            full_text
        )
        if not match:
            return None

        prefix, number, title, credits = match.groups()
        title = title.strip()

        # Handle credit ranges (e.g., "1-3")
        if "-" in credits:
            credits = credits.split("-")[1]  # Take max

        # Get description - text after credits but before "Rules & Requirements"
        desc_match = re.search(
            r"Credits?\.\s*(.+?)(?:Rules\s*&\s*Requirements|Grading\s*Status|Repeat\s*Rules|$)",
            full_text,
            re.IGNORECASE
        )
        description = desc_match.group(1).strip() if desc_match else ""

        # Clean up description
        description = re.sub(r'\s+', ' ', description).strip()

        # Get gen ed attributes
        geneds = extract_geneds(full_text)

        # Create course key
        course_key = f"{prefix}{number}"

        return {
            "key": course_key,
            "prefix": prefix,
            "number": number,
            "title": title,
            "credits": int(credits),
            "description": description,
            "geneds": geneds
        }
    except Exception as e:
        return None


def scrape_department(dept_code: str) -> list:
    """Scrape all courses from a department"""
    url = f"{COURSES_URL}{dept_code}/"

    try:
        soup = get_soup(url)
        courses = []

        # Find all course blocks
        course_blocks = soup.find_all("div", class_="courseblock")

        for block in course_blocks:
            course = parse_course_block(block)
            if course:
                courses.append(course)

        return courses

    except Exception as e:
        print(f"  Error scraping {dept_code}: {e}")
        return []


def main():
    """Main scraper function"""
    print("UNC Course Catalog Scraper")
    print("=" * 40)

    all_courses = {}

    for i, dept in enumerate(ARTS_SCIENCES_DEPTS):
        courses = scrape_department(dept)
        print(f"[{i+1}/{len(ARTS_SCIENCES_DEPTS)}] {dept.upper()}: {len(courses)} courses")

        for course in courses:
            key = course.pop("key")
            all_courses[key] = course

        # Be polite to the server
        time.sleep(0.3)

    print("=" * 40)
    print(f"Total courses scraped: {len(all_courses)}")

    # Count courses with gen eds
    gened_count = sum(1 for c in all_courses.values() if c["geneds"])
    print(f"Courses with gen ed attributes: {gened_count}")

    # Save to JSON
    output_path = Path(__file__).parent.parent.parent / "js" / "data" / "courses.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(all_courses, f, indent=2)

    print(f"\nSaved to: {output_path}")

    # Also save a backup with timestamp
    backup_path = Path(__file__).parent / "courses_backup.json"
    with open(backup_path, "w") as f:
        json.dump(all_courses, f, indent=2)
    print(f"Backup saved to: {backup_path}")


if __name__ == "__main__":
    main()
