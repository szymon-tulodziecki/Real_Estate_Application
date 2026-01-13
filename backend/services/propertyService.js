const Property = require('../models/Property');
const { createError } = require('../utils/errorUtils');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);

/**
 * Serwis do obsługi logiki biznesowej związanej z nieruchomościami
 */
const propertyService = {
  /**
   * Pobiera wszystkie nieruchomości z możliwością filtrowania i sortowania
   */
  getAllProperties: async (query = {}) => {
    const { 
      type, 
      status, 
      minPrice, 
      maxPrice, 
      minArea, 
      maxArea, 
      city, 
      page = 1, 
      limit = 10,
      sort = 'createdAt'
    } = query;

    const filter = {};

    // Budowanie filtrów
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (city) filter.city = { $regex: city, $options: 'i' };
    
    // Filtry zakresowe
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = Number(minArea);
      if (maxArea) filter.area.$lte = Number(maxArea);
    }

    // Paginacja
    const skip = (page - 1) * limit;
    
    // Sortowanie - domyślnie od najnowszych
    const sortDirection = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOptions = { [sortField]: sortDirection };

    const properties = await Property.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
  .populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations');

    const total = await Property.countDocuments(filter);
    
    return {
      properties,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Pobiera nieruchomość po ID
   */
  getPropertyById: async (propertyId) => {
    const property = await Property.findById(propertyId)
  .populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations');
    
    if (!property) {
      throw createError('Nieruchomość nie istnieje', 404);
    }
    
    return property;
  },

  /**
   * Tworzy nową nieruchomość
   */
  createProperty: async (propertyData, files = []) => {
    // Przetwarzanie przesłanych obrazów
    if (files && files.length > 0) {
      propertyData.images = files.map(file => file.filename);
    }

    const property = new Property(propertyData);
    await property.save();
    
    return property;
  },

  /**
   * Aktualizuje nieruchomość
   */
  updateProperty: async (propertyId, propertyData, files = []) => {
    const property = await Property.findById(propertyId);
    
    if (!property) {
      throw createError('Nieruchomość nie istnieje', 404);
    }

    // Przetwarzanie przesłanych obrazów
    if (files && files.length > 0) {
      // Jeśli są nowe obrazy, dodajemy je do istniejących
      const existingImages = property.images || [];
      propertyData.images = [...existingImages, ...files.map(file => file.filename)];
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      propertyData,
      { new: true, runValidators: true }
  ).populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations');

    return updatedProperty;
  },

  /**
   * Usuwa nieruchomość
   */
  deleteProperty: async (propertyId) => {
    const property = await Property.findById(propertyId);
    
    if (!property) {
      throw createError('Nieruchomość nie istnieje', 404);
    }

    // Usuwanie powiązanych plików graficznych
    if (property.images && property.images.length > 0) {
      const uploadsDir = path.join(__dirname, '../uploads/properties');
      
      for (const image of property.images) {
        try {
          await unlinkAsync(path.join(uploadsDir, image));
        } catch (err) {
          console.error(`Nie można usunąć pliku: ${image}`, err);
        }
      }
    }

    await Property.findByIdAndDelete(propertyId);
    
    return { message: 'Nieruchomość usunięta' };
  },

  /**
   * Usuwa obraz z nieruchomości
   */
  deletePropertyImage: async (propertyId, filename) => {
    const property = await Property.findById(propertyId);
    
    if (!property) {
      throw createError('Nieruchomość nie istnieje', 404);
    }

    // Sprawdzenie czy plik istnieje w tablicy obrazów
    if (!property.images.includes(filename)) {
      throw createError('Obraz nie istnieje', 404);
    }

    // Usuwanie pliku z dysku
    try {
      const filePath = path.join(__dirname, '../uploads/properties', filename);
      await unlinkAsync(filePath);
    } catch (err) {
      console.error(`Nie można usunąć pliku: ${filename}`, err);
      throw createError('Błąd podczas usuwania pliku', 500);
    }

    // Aktualizacja tablicy obrazów
    property.images = property.images.filter(img => img !== filename);
    await property.save();

    return property;
  }
};

module.exports = propertyService;
