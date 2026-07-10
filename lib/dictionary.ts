export type DictionaryResult = {
  word: string;
  ipa: string;
  partOfSpeech: string;
  definitionEn: string;
  exampleEn: string;
  meaningVi: string;
  audioUrl: string;
};

export async function lookupWord(word: string): Promise<DictionaryResult> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  
  // Also fetch translation from Google Translate free API
  const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`;

  const [res, translateRes] = await Promise.all([
    fetch(url),
    fetch(translateUrl)
  ]);

  if (!res.ok) {
    throw new Error("Word not found in dictionary.");
  }

  const data = await res.json();
  const entry = data[0];
  
  let meaningVi = "";
  if (translateRes.ok) {
    const translateData = await translateRes.json();
    meaningVi = translateData[0]?.[0]?.[0] || "";
  }

  const firstMeaning = entry.meanings?.[0];
  const firstDefinition = firstMeaning?.definitions?.[0];

  const audio = entry.phonetics?.find((p: any) => p.audio)?.audio || "";

  return {
    word: entry.word,
    ipa: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "",
    partOfSpeech: firstMeaning?.partOfSpeech || "",
    definitionEn: firstDefinition?.definition || "",
    exampleEn: firstDefinition?.example || "",
    meaningVi,
    audioUrl: audio.startsWith("//") ? `https:${audio}` : audio,
  };
}
