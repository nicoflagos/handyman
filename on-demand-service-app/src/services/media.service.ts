import { v2 as cloudinary } from 'cloudinary';

type UploadImageInput = {
  buffer: Buffer;
  folder: string;
  mimetype?: string;
};

let cloudinaryConfigured: boolean | null = null;

function isCloudinaryConfigured() {
  if (cloudinaryConfigured !== null) return cloudinaryConfigured;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  cloudinaryConfigured = !!(cloudName && apiKey && apiSecret);
  if (cloudinaryConfigured) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }
  return cloudinaryConfigured;
}

export async function uploadImage(input: UploadImageInput): Promise<string | null> {
  if (!isCloudinaryConfigured()) return null;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: input.folder,
        overwrite: false,
        unique_filename: true,
      },
      (err, result) => {
        if (err) return reject(err);
        const url = (result as any)?.secure_url || (result as any)?.url;
        if (!url) return reject(new Error('Cloudinary upload returned no url'));
        return resolve(String(url));
      },
    );
    stream.end(input.buffer);
  });
}

