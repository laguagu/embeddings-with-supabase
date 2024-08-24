import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";

interface ImageData {
  id: number;
  name: string;
  path: string;
  description: string;
  similarity?: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function getImage(id: string) {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function getSimilarImages(
  embedding: number[],
  description: string,
): Promise<ImageData[]> {
  try {
    const { data, error } = await supabase.rpc("match_images", {
      query_embedding: embedding,
      query_description: description,
      match_threshold: 0.5,
      match_count: 3,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching similar images:", error);
    return [];
  }
}

export default async function ImageDetails({
  params,
}: {
  params: { id: string };
}) {
  const image = await getImage(params.id);
  const similarImages = await getSimilarImages(
    image.embedding,
    image.description,
  );

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold my-8">{image.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Image
            src={image.path}
            alt={image.name}
            width={600}
            height={600}
            style={{ width: "100%", height: "auto" }}
            priority
          />
          <p className="mt-4">{image.description}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Similar Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {similarImages.map((simImage: ImageData) => (
              <Link href={`/images/${simImage.id}`} key={simImage.id}>
                <div className="border rounded-lg overflow-hidden">
                  <Image
                    src={simImage.path}
                    alt={simImage.name}
                    width={200}
                    height={200}
                    style={{ width: "100%", height: "auto" }}
                  />
                  <div className="p-2">
                    <h3 className="font-semibold text-sm">{simImage.name}</h3>
                    <p className="text-xs text-gray-600">
                      Similarity: {(simImage.similarity! * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Link
        href="/"
        className="mt-8 inline-block bg-blue-500 text-white px-4 py-2 rounded"
      >
        Back to Gallery
      </Link>
    </div>
  );
}
