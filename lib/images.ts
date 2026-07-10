export async function searchImages(query: string, apiKey: string): Promise<string[]> {
  if (!apiKey) return [];
  
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5`;
  
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error("Image search failed.");
    }
    
    const data = await res.json();
    return data.results.map((r: any) => r.urls.regular);
  } catch (err: any) {
    console.error("Error fetching images:", err);
    return [];
  }
}
