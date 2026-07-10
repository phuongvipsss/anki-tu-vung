export const ANKI_URL = "http://127.0.0.1:8765";

export async function invokeAnki(action: string, params: object = {}) {
  try {
    const res = await fetch(ANKI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        version: 6,
        params,
      }),
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.result;
  } catch (err: any) {
    if (err.message === "fetch failed" || err.cause?.code === "ECONNREFUSED") {
      throw new Error("AnkiConnect is not running. Please open Anki and ensure the AnkiConnect add-on is installed.");
    }
    throw err;
  }
}

export type VocabCard = {
  word: string;
  ipa?: string;
  meaningVi: string;
  definitionEn: string;
  exampleEn: string;
  exampleVi: string;
  audioUrl?: string;
  imageUrl?: string;
  deckName: string;
  modelName: string;
};

export async function addVocabToAnki(card: VocabCard) {
  const front = `
    <div style="text-align: center; font-family: Arial, sans-serif;">
      <h2 style="font-size: 24px; margin-bottom: 5px;">${card.word}</h2>
      ${card.ipa ? `<p style="color: #666; font-size: 16px;">/${card.ipa}/</p>` : ""}
      ${card.imageUrl ? `<img src="${card.imageUrl}" style="max-width:300px; border-radius: 8px; margin-top: 10px;" />` : ""}
    </div>
  `;

  const back = `
    <div style="text-align: left; font-family: Arial, sans-serif; font-size: 16px;">
      <h3 style="color: #3b82f6; margin-bottom: 10px;">${card.meaningVi}</h3>
      <p><b>Definition:</b> ${card.definitionEn}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
      <p><b>Example:</b> ${card.exampleEn}</p>
      <p><i style="color: #555;">${card.exampleVi}</i></p>
    </div>
  `;

  const modelName = card.modelName || "Basic";

  // Fetch actual field names for the model (handles localized Anki setups like "Mặt trước", "Mặt sau")
  const fieldNames = await invokeAnki("modelFieldNames", { modelName });
  
  if (!fieldNames || fieldNames.length < 2) {
    throw new Error(`The model "${modelName}" must have at least 2 fields.`);
  }

  const fields: Record<string, string> = {};
  fields[fieldNames[0]] = front;
  fields[fieldNames[1]] = back;

  const note: any = {
    deckName: card.deckName || "Default",
    modelName: modelName,
    fields,
    tags: ["vocab-web", "auto-added"],
    options: {
        allowDuplicate: false,
    }
  };

  if (card.audioUrl) {
    note.audio = [{
      url: card.audioUrl,
      filename: `vocab_${card.word}.mp3`,
      fields: [
        fieldNames[0]
      ]
    }];
  }

  // Ensure the deck exists
  await invokeAnki("createDeck", {
    deck: note.deckName,
  });

  // Check if we can add
  const canAdd = await invokeAnki("canAddNotesWithErrorDetail", {
    notes: [note],
  });

  if (!canAdd[0].canAdd) {
    throw new Error(`Cannot add card to Anki: ${canAdd[0].error}`);
  }

  return await invokeAnki("addNote", {
    note,
  });
}
