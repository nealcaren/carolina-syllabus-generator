#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "requests",
#     "beautifulsoup4",
# ]
# ///
"""Debug script to inspect catalog HTML structure"""

import requests
from bs4 import BeautifulSoup

url = 'https://catalog.unc.edu/courses/soci/'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(r.text, 'html.parser')

print("=== Debugging catalog HTML ===\n")

# Get first course block
blocks = soup.find_all('div', class_='courseblock')
print(f'Found {len(blocks)} courseblock divs\n')

if blocks:
    block = blocks[0]
    print("=== First course block structure ===")
    print(f"Direct children:")
    for child in block.children:
        if hasattr(child, 'name') and child.name:
            print(f"  <{child.name}> class={child.get('class')}")
            text = child.get_text(strip=True)[:100]
            print(f"    Text: {repr(text)}")

    print("\n=== Looking for title element ===")
    title_p = block.find('p', class_='courseblocktitle')
    if title_p:
        print(f"Found courseblocktitle: {repr(title_p.get_text(strip=True))}")
    else:
        print("No courseblocktitle found")
        # Try other approaches
        all_p = block.find_all('p')
        print(f"Found {len(all_p)} p elements")
        for p in all_p[:3]:
            print(f"  class={p.get('class')}: {repr(p.get_text(strip=True)[:80])}")

    print("\n=== Full first block text ===")
    print(repr(block.get_text()[:500]))
