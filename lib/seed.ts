import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import sharp from "sharp";
import { loadEnvConfig } from "@next/env";
import axios from "axios";

const animalImageUrls = [
  "https://images.unsplash.com/photo-1474511320723-9a56873867b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Fox
  "https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Lion
  "https://images.unsplash.com/photo-1546182990-dffeafbe841d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Penguin
  "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Panda
  "https://images.unsplash.com/photo-1522720833375-9c27ffb02a5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Elephant
  "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Parrot
  "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Turtle
  "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Lemur
  "https://images.unsplash.com/photo-1591824438708-ce405f36ba3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Koala
  "https://images.unsplash.com/photo-1555169062-013468b47731?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Zebra
];
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const client = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processImage(imageUrl: string): Promise<Buffer> {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return sharp(response.data)
    .resize(224, 224)
    .toFormat("jpeg")
    .jpeg({ quality: 50 })
    .toBuffer();
}

async function getImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: base64Image,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error getting image embedding:", error);
    throw error;
  }
}

async function getImageDescription(imageBuffer: Buffer): Promise<string> {
  const base64Image = imageBuffer.toString("base64");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image briefly." },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    return response.choices[0].message.content || "No description available";
  } catch (error) {
    console.error("Error getting image description:", error);
    return "Failed to generate description";
  }
}

async function seedImages() {
  for (let i = 0; i < animalImageUrls.length; i++) {
    const imageUrl = animalImageUrls[i];
    console.log(`Processing image ${i + 1}/${animalImageUrls.length}`);

    try {
      const processedImageBuffer = await processImage(imageUrl);
      const embedding = await getImageEmbedding(processedImageBuffer);
      const description = await getImageDescription(processedImageBuffer);

      const { data, error } = await client.from("images").insert({
        name: `animal_${i + 1}.jpg`,
        path: imageUrl,
        embedding,
        description,
      });

      if (error) {
        console.error(`Error inserting image ${i + 1}:`, error);
      } else {
        console.log(`Successfully inserted image ${i + 1}`);
      }
    } catch (error) {
      console.error(`Error processing image ${i + 1}:`, error);
    }
  }

  console.log("All images processed and added to the database.");
}

seedImages().catch(console.error);
