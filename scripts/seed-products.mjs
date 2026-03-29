#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

// Mirror Next.js env loading for standalone Node scripts (.env, .env.local, etc.).
loadEnvConfig(REPO_ROOT);

const STORAGE_BUCKET = process.env.SUPABASE_PRODUCTS_BUCKET || "products";
const STORAGE_FOLDER = "products";

function logInfo(message) {
  console.log(`[seed:products][INFO] ${message}`);
}

function logSuccess(message) {
  console.log(`[seed:products][SUCCESS] ${message}`);
}

function logError(message) {
  console.error(`[seed:products][ERROR] ${message}`);
}

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toPosixPath(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function loadProductSeeds() {
  const filePath = path.join(REPO_ROOT, "data", "products.ts");
  const source = await readFile(filePath, "utf8");

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  });

  const cjsModule = { exports: {} };
  const context = vm.createContext({
    module: cjsModule,
    exports: cjsModule.exports,
    require,
    process,
    console,
    __dirname: path.dirname(filePath),
    __filename: filePath,
  });

  const script = new vm.Script(transpiled.outputText, { filename: filePath });
  script.runInContext(context);

  const exports = cjsModule.exports;
  const seeds = exports.PRODUCT_SEEDS || exports.default;

  if (!Array.isArray(seeds)) {
    throw new Error("data/products.ts must export PRODUCT_SEEDS array");
  }

  return seeds;
}

async function ensurePublicBucket(supabase, bucketName) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    throw new Error(`Unable to list storage buckets: ${error.message}`);
  }

  const existing = (data || []).find((bucket) => bucket.name === bucketName);
  if (existing) {
    logInfo(`Using existing storage bucket '${bucketName}'.`);
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: "10MB",
  });

  if (createError) {
    throw new Error(`Unable to create storage bucket '${bucketName}': ${createError.message}`);
  }

  logSuccess(`Created storage bucket '${bucketName}'.`);
}

function validateSeed(seed, index) {
  const requiredKeys = [
    "slug",
    "title",
    "articleCode",
    "description",
    "price",
    "quantity",
    "maxQuantity",
    "setType",
    "style",
    "medium",
    "frame",
    "size",
    "dimensions",
    "artist",
    "imagePath",
  ];

  for (const key of requiredKeys) {
    if (seed[key] === undefined || seed[key] === null || seed[key] === "") {
      throw new Error(`Seed index ${index} is missing required field: ${key}`);
    }
  }
}

async function seedProducts() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const seeds = await loadProductSeeds();
  logInfo(`Loaded ${seeds.length} products from data/products.ts`);

  await ensurePublicBucket(supabase, STORAGE_BUCKET);

  const failures = [];
  let succeeded = 0;

  for (let i = 0; i < seeds.length; i += 1) {
    const seed = seeds[i];

    try {
      validateSeed(seed, i);
      const coverPath = await resolveCoverPath(seed);
      const coverExtension = path.extname(coverPath).toLowerCase() || ".jpg";
      const coverStoragePath = toPosixPath(path.join(STORAGE_FOLDER, seed.slug, `cover${coverExtension}`));
      const coverPublicUrl = await uploadAndGetPublicUrl(supabase, coverPath, coverStoragePath);

      const galleryPaths = await findGalleryPaths(seed.slug);
      const galleryPublicUrls = [];
      for (const galleryPath of galleryPaths) {
        const galleryFileName = path.basename(galleryPath);
        const galleryStoragePath = toPosixPath(path.join(STORAGE_FOLDER, seed.slug, galleryFileName));
        const galleryPublicUrl = await uploadAndGetPublicUrl(supabase, galleryPath, galleryStoragePath);
        galleryPublicUrls.push(galleryPublicUrl);
      }

      const productRow = {
        slug: seed.slug,
        title: seed.title,
        article_code: seed.articleCode,
        description: seed.description,
        image: coverPublicUrl,
        gallery_images: galleryPublicUrls,
        price: seed.price,
        quantity: seed.quantity,
        max_quantity: seed.maxQuantity,
        set_type: seed.setType,
        style: seed.style,
        medium: seed.medium,
        frame: seed.frame,
        size: seed.size,
        dimensions: seed.dimensions,
        artist: seed.artist,
        featured: Boolean(seed.featured),
        bestseller: Boolean(seed.bestseller),
      };

      const { error: upsertError } = await supabase
        .from("products")
        .upsert(productRow, { onConflict: "slug" });

      if (upsertError) {
        throw new Error(`Database upsert failed: ${upsertError.message}`);
      }

      succeeded += 1;
      logSuccess(`Seeded '${seed.slug}' -> ${coverPublicUrl}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push({ slug: seed?.slug || `index-${i}`, message });
      logError(`Failed '${seed?.slug || `index-${i}`}' - ${message}`);
    }
  }

  logInfo(`Completed seeding. Success: ${succeeded}, Failed: ${failures.length}`);

  if (failures.length > 0) {
    logError("Failure summary:");
    for (const failure of failures) {
      logError(`- ${failure.slug}: ${failure.message}`);
    }
    process.exitCode = 1;
  }
}

async function uploadAndGetPublicUrl(supabase, absoluteImagePath, storagePath) {
  await access(absoluteImagePath);

  const fileBuffer = await readFile(absoluteImagePath);
  const contentType = getContentType(absoluteImagePath);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData.publicUrl;
  if (!publicUrl) {
    throw new Error(`Could not generate public URL for ${storagePath}`);
  }

  return publicUrl;
}

async function resolveCoverPath(seed) {
  const candidates = [
    path.resolve(REPO_ROOT, "public", "products", seed.slug, "cover.jpg"),
    path.resolve(REPO_ROOT, seed.imagePath),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Cover image missing for ${seed.slug}. Expected one of: ${candidates.map((p) => toPosixPath(path.relative(REPO_ROOT, p))).join(", ")}`,
  );
}

async function findGalleryPaths(slug) {
  const galleryPaths = [];
  for (const fileName of ["1.jpg", "2.jpg", "3.jpg", "4.jpg"]) {
    const absolutePath = path.resolve(REPO_ROOT, "public", "products", slug, fileName);
    try {
      await access(absolutePath);
      galleryPaths.push(absolutePath);
    } catch {
      // gallery image is optional
    }
  }
  return galleryPaths;
}

seedProducts().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  logError(message);
  process.exit(1);
});
