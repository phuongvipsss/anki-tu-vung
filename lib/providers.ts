// Mock Search Providers for Phase 3

export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
};

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  sourceDomain: string;
};

export async function searchYouTube(query: string, limit = 5): Promise<YouTubeVideo[]> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1000));

  const safeQuery = query.toLowerCase();

  // Return some dummy videos based on common ESL topics
  return Array.from({ length: limit }).map((_, i) => ({
    videoId: `mock_yt_${i}_${Date.now()}`,
    title: `Learn English: ${query} (Lesson ${i + 1})`,
    channelTitle: `English with ${["Emma", "Bob", "Lucy", "John"][i % 4]}`,
    url: `https://youtube.com/watch?v=mock_yt_${i}`,
    thumbnailUrl: `https://picsum.photos/seed/yt${i}/320/180`,
    duration: `${Math.floor(Math.random() * 15) + 3}:${Math.floor(Math.random() * 50) + 10}`,
    publishedAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
  }));
}

export async function searchWeb(query: string, limit = 5): Promise<WebSearchResult[]> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1000));

  return Array.from({ length: limit }).map((_, i) => ({
    title: `Mastering ${query} - Complete Guide`,
    url: `https://mock-esl-domain${i}.com/lesson-${i}`,
    snippet: `This comprehensive guide covers everything you need to know about ${query}. Perfect for ESL learners preparing for exams or improving their daily English.`,
    sourceDomain: `mock-esl-domain${i}.com`
  }));
}
