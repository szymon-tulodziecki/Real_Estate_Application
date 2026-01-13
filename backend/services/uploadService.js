const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Konfiguracja Cloudinary z URL
// Format: cloudinary://api_key:api_secret@cloud_name
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (!cloudinaryUrl) {
  console.error('CLOUDINARY_URL is not set in environment variables');
} else {
  // Parsuj URL i skonfiguruj Cloudinary
  const urlMatch = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (urlMatch) {
    const config = {
      cloud_name: urlMatch[3],
      api_key: urlMatch[1],
      api_secret: urlMatch[2],
      secure: true
    };
    cloudinary.config(config);
    console.log('Cloudinary configured:');
    console.log('  - cloud_name:', config.cloud_name);
    console.log('  - api_key:', config.api_key.substring(0, 6) + '...');
    console.log('  - api_secret:', config.api_secret.substring(0, 6) + '...');
  } else {
    console.error('Invalid CLOUDINARY_URL format. Expected: cloudinary://api_key:api_secret@cloud_name');
  }
}

/**
 * Upload avatar dla użytkownika
 * @param {Buffer} fileBuffer - Buffer pliku
 * @param {string} userId - ID użytkownika
 * @param {string} mimetype - Typ MIME pliku
 * @returns {Promise<{avatarUrl: string}>}
 */
const uploadAvatar = async (fileBuffer, userId, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `real_estate_crm/avatars`,
        public_id: `user_${userId}`,
        overwrite: true,
        resource_type: 'image',
        format: 'jpg',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary avatar upload error:', error);
          return reject(new Error('Błąd przesyłania avatara do Cloudinary'));
        }
        resolve({ avatarUrl: result.secure_url });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Upload wielu zdjęć dla nieruchomości
 * @param {Array<{buffer: Buffer, originalname: string, mimetype: string}>} files - Tablica plików
 * @param {string} propertyId - ID nieruchomości
 * @returns {Promise<Array<{filename: string, url: string}>>}
 */
const uploadPropertyImages = async (files, propertyId) => {
  const uploadPromises = files.map((file, index) => {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `real_estate_crm/properties/${propertyId}`,
          public_id: `${timestamp}_${index}`,
          resource_type: 'image',
          format: 'jpg',
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary property image upload error:', error);
            return reject(new Error(`Błąd przesyłania zdjęcia ${file.originalname}`));
          }
          resolve({
            filename: result.public_id,
            url: result.secure_url
          });
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  });

  return Promise.all(uploadPromises);
};

/**
 * Usuń wszystkie zdjęcia nieruchomości
 * @param {string} propertyId - ID nieruchomości
 * @returns {Promise<void>}
 */
const deletePropertyImages = async (propertyId) => {
  try {
    // Usuń cały folder nieruchomości
    await cloudinary.api.delete_resources_by_prefix(
      `real_estate_crm/properties/${propertyId}/`
    );
    
    // Usuń sam folder
    await cloudinary.api.delete_folder(`real_estate_crm/properties/${propertyId}`);
    
    console.log(`Usunięto wszystkie zdjęcia nieruchomości ${propertyId}`);
  } catch (error) {
    console.error('Błąd usuwania zdjęć z Cloudinary:', error);
    // Nie rzucamy błędu, bo chcemy kontynuować usuwanie nieruchomości
  }
};

/**
 * Usuń pojedyncze zdjęcie nieruchomości
 * @param {string} publicId - Public ID zdjęcia w Cloudinary (np. filename z bazy)
 * @returns {Promise<void>}
 */
const deletePropertyImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Usunięto zdjęcie: ${publicId}`);
  } catch (error) {
    console.error('Błąd usuwania zdjęcia z Cloudinary:', error);
    throw new Error('Nie udało się usunąć zdjęcia');
  }
};

/**
 * Usuń avatar użytkownika
 * @param {string} userId - ID użytkownika
 * @returns {Promise<void>}
 */
const deleteAvatar = async (userId) => {
  try {
    await cloudinary.uploader.destroy(`real_estate_crm/avatars/user_${userId}`);
    console.log(`Usunięto avatar użytkownika ${userId}`);
  } catch (error) {
    console.error('Błąd usuwania avatara z Cloudinary:', error);
    // Nie rzucamy błędu
  }
};

module.exports = {
  uploadAvatar,
  uploadPropertyImages,
  deletePropertyImages,
  deletePropertyImage,
  deleteAvatar
};
