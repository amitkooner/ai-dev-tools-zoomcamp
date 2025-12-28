from fastmcp import FastMCP
import requests
import zipfile
import io
import minsearch

mcp = FastMCP("Demo 🚀")

# Initialize the index
index = None

def download_and_index():
    global index
    
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
    
    return f"Indexed {len(documents)} documents"

# Initialize on startup
download_and_index()

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.tool
def scrape_web(url: str) -> str:
    """Scrape a web page and return its content as markdown using Jina Reader"""
    jina_url = f"https://r.jina.ai/{url}"
    response = requests.get(jina_url)
    return response.text

@mcp.tool
def search_docs(query: str) -> str:
    """Search the FastMCP documentation and return the 5 most relevant documents"""
    global index
    results = index.search(query, num_results=5)
    output = []
    for r in results:
        output.append(f"**{r['filename']}**\n{r['content'][:500]}...")
    return "\n\n---\n\n".join(output)

if __name__ == "__main__":
    mcp.run()