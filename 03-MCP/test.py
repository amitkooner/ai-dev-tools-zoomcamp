import requests

def scrape_web(url: str) -> str:
    """Scrape a web page and return its content as markdown using Jina Reader"""
    jina_url = f"https://r.jina.ai/{url}"
    response = requests.get(jina_url)
    return response.text

content = scrape_web("https://github.com/alexeygrigorev/minsearch")
print(f"Character count: {len(content)}")