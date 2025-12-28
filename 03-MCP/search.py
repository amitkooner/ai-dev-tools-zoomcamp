import requests
import zipfile
import io
import minsearch

zip_url = "https://github.com/jlowin/fastmcp/archive/refs/heads/main.zip"

response = requests.get(zip_url)

documents = []

with zipfile.ZipFile(io.BytesIO(response.content)) as z:
    for filename in z.namelist():
        if filename.endswith('.md') or filename.endswith('.mdx'):
            parts = filename.split('/', 1)
            short_name = parts[1] if len(parts) > 1 else filename
            content = z.read(filename).decode('utf-8')
            documents.append({
                "filename": short_name,
                "content": content
            })

index = minsearch.Index(
    text_fields=["content"],
    keyword_fields=["filename"]
)
index.fit(documents)

results = index.search("demo", num_results=5)

print("Top 5 results for 'demo':")
for r in results:
    print(f"  - {r['filename']}")