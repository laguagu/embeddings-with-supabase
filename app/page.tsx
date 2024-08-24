"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface ImageData {
  id: number;
  name: string;
  path: string;
  description: string;
}

export default function Home() {
  const [images, setImages] = useState<ImageData[]>([]);

  useEffect(() => {
    async function fetchImages() {
      const { data, error } = await supabase
        .from("images")
        .select("id, name, path, description");

      if (error) {
        console.error("Error fetching images:", error);
      } else {
        setImages(data || []);
      }
    }

    fetchImages();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold my-8">Image Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Link href={`/images/${image.id}`} key={image.id}>
            <div className="border rounded-lg overflow-hidden">
              <Image
                src={image.path}
                alt={image.name}
                width={600}
                height={600}
                priority
                style={{ width: "auto", height: "auto" }}
              />
              <div className="p-4">
                <h2 className="font-semibold">{image.name}</h2>
                <p className="text-sm text-gray-600">
                  {image.description.substring(0, 100)}...
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
