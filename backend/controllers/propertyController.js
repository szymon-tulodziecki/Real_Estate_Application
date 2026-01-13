const Property = require('../models/Property');
const RecentlySoldProperty = require('../models/RecentlySoldProperty');
const User = require('../models/User');
const uploadService = require('../services/uploadService');
const { getPropertyLock, acquirePropertyLock } = require('../middleware/propertyLock');

// GET /api/properties - pobierz wszystkie nieruchomości
const getAllProperties = async (req, res) => {
  try {
    console.log('[getAllProperties] START - Query params:', req.query);
    const { transactionType, type, country, sortBy, limit } = req.query;
    
    // Build query
    const query = { status: 'aktywne' };
    
    // Agent może widzieć tylko swoje nieruchomości
    if (req.user && req.user.role === 'agent') {
      query.agent = req.user._id;
      console.log('[getAllProperties] Filtering by agent:', req.user._id);
    }
    
    if (transactionType) {
      query.transactionType = transactionType;
      console.log('[getAllProperties] Filtering by transactionType:', transactionType);
    }
    
    if (type) {
      query.type = type;
      console.log('[getAllProperties] Filtering by type:', type);
    }

    if (country) {
      // Case-insensitive country search
      query['location.country'] = { $regex: country, $options: 'i' };
      console.log('[getAllProperties] Filtering by country:', country);
    }
    
    console.log('[getAllProperties] Final query:', JSON.stringify(query));
    
    // Determine sort order
    let sort = { createdAt: -1 }; // Default: newest first
    
    if (sortBy === 'price') {
      sort = { price: 1 }; // Price ascending
    } else if (sortBy === '-price') {
      sort = { price: -1 }; // Price descending
    } else if (sortBy === 'createdAt') {
      sort = { createdAt: -1 }; // Newest first (explicit)
    }
    
    let queryBuilder = Property.find(query)
      .populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations')
      .sort(sort);
    
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (limitNum > 0) {
        queryBuilder = queryBuilder.limit(limitNum);
      }
    }
    
    const properties = await queryBuilder;
    
    // Debug: wypisz unikalne typy jeśli nie ma filtra
    if (!type) {
      const uniqueTypes = [...new Set(properties.map(p => p.type))];
      console.log('[getAllProperties] Unique types in DB:', uniqueTypes);
    }
    
    console.log('[getAllProperties] SUCCESS - Found', properties.length, 'properties');
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('[getAllProperties] ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Błąd podczas pobierania nieruchomości',
      error: error.message 
    });
  }
};

const getRecentlySoldProperties = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 4, 8));
    const properties = await RecentlySoldProperty.find()
      .sort({ soldAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('Error fetching recently sold properties:', error);
    res.status(500).json({
      message: 'Błąd podczas pobierania ostatnio sprzedanych nieruchomości',
      error: error.message,
    });
  }
};

// GET /api/properties/stats - aggregated public stats
const getPropertyStats = async (req, res) => {
  try {
    const baseMatch = { status: 'aktywne' };

    const distinctCities = await Property.distinct('location.city', baseMatch);
    const uniqueCities = distinctCities
      .map(city => (typeof city === 'string' ? city.trim() : ''))
      .filter(Boolean).length;

    const fetchMinPrice = async (transactionTypes) => {
      const pipeline = [
        {
          $match: {
            ...baseMatch,
            transactionType: { $in: transactionTypes },
          },
        },
        {
          $addFields: {
            effectivePrice: {
              $cond: [
                {
                  $and: [
                    { $ifNull: ['$promotionalPrice', false] },
                    { $gt: ['$promotionalPrice', 0] },
                  ],
                },
                '$promotionalPrice',
                '$price',
              ],
            },
          },
        },
        { $match: { effectivePrice: { $gt: 0 } } },
        { $sort: { effectivePrice: 1 } },
        { $limit: 1 },
        { $project: { _id: 0, effectivePrice: 1 } },
      ];

      const result = await Property.aggregate(pipeline);
      return result?.[0]?.effectivePrice || 0;
    };

    const saleTypes = ['sprzedaż', 'sprzedaz', 'sprzedaż_wynajem', 'sprzedaz_wynajem'];
    const rentTypes = ['wynajem', 'sprzedaż_wynajem', 'sprzedaz_wynajem'];

    const [minSalePrice, minRentPrice] = await Promise.all([
      fetchMinPrice(saleTypes),
      fetchMinPrice(rentTypes),
    ]);

    res.json({
      success: true,
      data: {
        uniqueCities,
        minSalePrice,
        minRentPrice,
        satisfactionRate: 100,
      },
    });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania statystyk nieruchomości',
      error: error.message,
    });
  }
};

// GET /api/properties/:id - pobierz nieruchomość po ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findById(id)
      .populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations')
      .populate('createdBy', 'firstName lastName');
    
    if (!property) {
      return res.status(404).json({ message: 'Nieruchomość nie znaleziona' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ 
      message: 'Błąd podczas pobierania nieruchomości',
      error: error.message 
    });
  }
};

// POST /api/properties - dodaj nową nieruchomość
const createProperty = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    const actingUser = await User.findById(req.user._id).select('role isPublic');
    if (!actingUser) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const isActingElevated = actingUser.role === 'root' || actingUser.role === 'admin';
    const isActingAgent = actingUser.role === 'agent';
    if ((isActingAgent || actingUser.role === 'admin') && actingUser.isPublic === false) {
      return res.status(403).json({
        message: 'Aby dodać nieruchomość, Twój profil musi być oznaczony jako publiczny.',
      });
    }

    const requestedAgentId = req.body.agent || req.user._id.toString();

    if (actingUser.role === 'agent' && requestedAgentId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Agent nie może przypisać nieruchomości do innego opiekuna.' });
    }

    const assignedAgent = await User.findById(requestedAgentId).select('role isPublic firstName lastName');
    if (!assignedAgent) {
      return res.status(400).json({ message: 'Wybrany opiekun nie istnieje.' });
    }

    if (assignedAgent.role === 'root') {
      return res.status(400).json({ message: 'Root Administrator nie może być przypisany jako opiekun nieruchomości.' });
    }

    if ((assignedAgent.role === 'agent' || assignedAgent.role === 'admin') && assignedAgent.isPublic === false) {
      return res.status(400).json({ message: 'Wybrany opiekun musi mieć publiczny profil, aby reprezentować nieruchomość.' });
    }

    const propertyData = {
      ...req.body,
      agent: assignedAgent._id,
      createdBy: req.user._id,
      images: []
    };

    const property = new Property(propertyData);
    await property.save();
    
    // Obsługa zdjęć jeśli zostały przesłane
    if (req.files && req.files.length > 0) {
      console.log('Uploading images for new property:', req.files.length);
      
      const uploaded = await uploadService.uploadPropertyImages(req.files, property._id);
      
      // Sprawdź który indeks ma być głównym zdjęciem
      const mainImageIndex = req.body.mainImageIndex ? parseInt(req.body.mainImageIndex, 10) : 0;
      
      // Dodaj zdjęcia do property
      uploaded.forEach((img, index) => {
        property.images.push({
          filename: img.filename,
          url: img.url,
          isMain: index === mainImageIndex
        });
      });
      
      await property.save();
      console.log('Images uploaded successfully:', uploaded.length);
    }
    
    // Populate po zapisaniu
  await property.populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations');
    await property.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Nieruchomość dodana pomyślnie',
      property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Błędy walidacji',
        errors
      });
    }
    
    res.status(500).json({ 
      message: 'Błąd podczas dodawania nieruchomości',
      error: error.message 
    });
  }
};

// PUT /api/properties/:id - aktualizuj nieruchomość
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: 'Nieruchomość nie znaleziona' });
    }

    // Sprawdź uprawnienia
    const isRoot = req.user.role === 'root';
    const isAdmin = req.user.role === 'admin';
    const isOwner = property.agent.toString() === req.user._id.toString();
    
    if (!isRoot && !isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tej nieruchomości' });
    }

    // Aktualizuj dane tekstowe
    const updates = { ...req.body };

    if (updates.agent) {
      const requestedAgentId = updates.agent;

      if (req.user.role === 'agent' && requestedAgentId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Agent nie może przepisać nieruchomości do innego opiekuna.' });
      }

      const assignedAgent = await User.findById(requestedAgentId).select('role isPublic');
      if (!assignedAgent) {
        return res.status(400).json({ message: 'Wybrany opiekun nie istnieje.' });
      }

      if (assignedAgent.role === 'root') {
        return res.status(400).json({ message: 'Root Administrator nie może być przypisany jako opiekun nieruchomości.' });
      }

      if ((assignedAgent.role === 'agent' || assignedAgent.role === 'admin') && assignedAgent.isPublic === false) {
        return res.status(400).json({ message: 'Wybrany opiekun musi mieć publiczny profil, aby reprezentować nieruchomość.' });
      }

      updates.agent = assignedAgent._id;
    }

    Object.assign(property, updates);
    property.updatedAt = new Date();
    
    // Obsługa usuwania zdjęć
    if (req.body.imagesToDelete) {
      const imagesToDelete = Array.isArray(req.body.imagesToDelete) 
        ? req.body.imagesToDelete 
        : [req.body.imagesToDelete];
      
      if (imagesToDelete.length > 0) {
        console.log('Deleting images:', imagesToDelete);
        
        // Usuń zdjęcia z Cloudinary
        for (const filename of imagesToDelete) {
          try {
            await uploadService.deletePropertyImage(id, filename);
          } catch (deleteError) {
            console.error('Error deleting image from Cloudinary:', deleteError);
            // Kontynuuj mimo błędu
          }
        }
        
        // Usuń z bazy danych
        property.images = property.images.filter(
          img => !imagesToDelete.includes(img.filename)
        );
      }
    }
    
    // Obsługa nowych zdjęć
    if (req.files && req.files.length > 0) {
      console.log('Uploading new images:', req.files.length);
      
      try {
        const uploaded = await uploadService.uploadPropertyImages(req.files, id);
        
        // Sprawdź który indeks nowych zdjęć ma być głównym
        const newMainImageIndex = req.body.newMainImageIndex ? parseInt(req.body.newMainImageIndex, 10) : null;
        const currentImageCount = property.images.length;
        const hasMainImageBefore = property.images.some(img => img.isMain);
        
        // Dodaj nowe zdjęcia do property
        uploaded.forEach((img, index) => {
          const isMainImage = newMainImageIndex !== null && index === newMainImageIndex;
          
          property.images.push({
            filename: img.filename,
            url: img.url,
            // Ustaw jako główne tylko jeśli: 
            // 1) Wyraźnie zaznaczono to zdjęcie jako główne LUB
            // 2) To pierwsze zdjęcie I nie było wcześniej żadnego głównego
            isMain: isMainImage || (!hasMainImageBefore && currentImageCount === 0 && index === 0)
          });
          
          // Jeśli to nowe zdjęcie jest główne, usuń flagę isMain z innych
          if (isMainImage) {
            property.images.forEach((existingImg, existingIndex) => {
              if (existingIndex < currentImageCount) {
                existingImg.isMain = false;
              }
            });
          }
        });
        
        console.log('Images uploaded successfully:', uploaded.length);
      } catch (uploadError) {
        console.error('Upload error details:', uploadError);
        // Zwróć szczegółowy błąd
        return res.status(500).json({
          message: uploadError.message || 'Błąd podczas uploadu zdjęć',
          error: uploadError.toString()
        });
      }
    }
    
    // Obsługa zmiany głównego zdjęcia (dla istniejących zdjęć)
    if (req.body.mainImage) {
      property.images.forEach(img => {
        img.isMain = img.filename === req.body.mainImage;
      });
    }
    
    await property.save();
    
    // Populate po aktualizacji
  await property.populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations');
    await property.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Nieruchomość zaktualizowana pomyślnie',
      property
    });
  } catch (error) {
    console.error('Error updating property:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Błędy walidacji',
        errors
      });
    }
    
    res.status(500).json({ 
      message: 'Błąd podczas aktualizacji nieruchomości',
      error: error.message 
    });
  }
};

// DELETE /api/properties/:id - usuń nieruchomość
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: 'Nieruchomość nie znaleziona' });
    }
    const isRoot = req.user.role === 'root';
    const isAdmin = req.user.role === 'admin';
    const isOwner = property.agent.toString() === req.user._id.toString();
    if (!isRoot && !isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Brak uprawnień do usunięcia tej nieruchomości' });
    }
    // Sprawdź istniejący lock
    const existingLock = await getPropertyLock(id);
    if (existingLock && existingLock.userId !== req.user._id.toString()) {
      return res.status(423).json({ message: 'Nieruchomość jest obecnie edytowana przez innego użytkownika' });
    }
    // Uzyskaj / odśwież lock dla tego użytkownika (zapewnia spójność)
    await acquirePropertyLock(id, req.user._id.toString());
    
    // Usuń pliki nieruchomości z Cloudinary
    try {
      await uploadService.deletePropertyImages(property._id);
    } catch (fileError) {
      console.warn('Błąd podczas usuwania plików:', fileError.message);
    }
    
    const shouldArchiveSold = String(req.query.markAsRecentlySold || '').toLowerCase() === 'true';

    if (shouldArchiveSold) {
      await property.populate('agent', 'firstName lastName avatar');
    }

    if (shouldArchiveSold) {
      try {
        await RecentlySoldProperty.deleteOne({ propertyId: property._id });

        const mainImage = property.images?.find(img => img.isMain) || property.images?.[0] || null;

        await RecentlySoldProperty.create({
          propertyId: property._id,
          title: property.title,
          description: property.description,
          price: property.price,
          promotionalPrice: property.promotionalPrice,
          transactionType: property.transactionType,
          area: property.area,
          rooms: property.rooms,
          location: property.location ? {
            address: property.location.address,
            city: property.location.city,
            district: property.location.district,
            voivodeship: property.location.voivodeship,
            postalCode: property.location.postalCode,
          } : undefined,
          coordinates: property.location?.coordinates ? {
            x: property.location.coordinates.x,
            y: property.location.coordinates.y,
          } : undefined,
          image: mainImage ? {
            filename: mainImage.filename,
            url: mainImage.url,
          } : undefined,
          agent: property.agent ? {
            firstName: property.agent.firstName,
            lastName: property.agent.lastName,
            avatar: property.agent.avatar,
          } : undefined,
          soldAt: new Date(),
        });

        const totalSold = await RecentlySoldProperty.countDocuments();
        if (totalSold > 4) {
          const surplus = await RecentlySoldProperty.find()
            .sort({ soldAt: 1 })
            .limit(totalSold - 4);
          if (surplus.length > 0) {
            await RecentlySoldProperty.deleteMany({ _id: { $in: surplus.map(item => item._id) } });
          }
        }
      } catch (archiveError) {
        console.warn('Nie udało się zarchiwizować nieruchomości jako sprzedanej:', archiveError.message);
      }
    }

    await Property.findByIdAndDelete(id);
    res.json({ message: 'Nieruchomość usunięta pomyślnie' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania nieruchomości', error: error.message });
  }
};

// GET /api/properties/status - status serwisu
const getStatus = async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const activeProperties = await Property.countDocuments({ status: 'aktywne' });
    const soldProperties = await Property.countDocuments({ status: 'sprzedane' });
    const rentedProperties = await Property.countDocuments({ status: 'wynajęte' });
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      statistics: {
        total: totalProperties,
        active: activeProperties,
        sold: soldProperties,
        rented: rentedProperties
      }
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ 
      message: 'Błąd podczas pobierania statusu',
      error: error.message 
    });
  }
};

// POST /api/properties/:id/images - upload images via Cloudinary
const uploadPropertyImages = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Nieruchomość nie znaleziona' });

    const isRoot = req.user.role === 'root';
    const isAdmin = req.user.role === 'admin';
    const isOwner = property.agent.toString() === req.user._id.toString();
    if (!isRoot && !isAdmin && !isOwner) return res.status(403).json({ message: 'Brak uprawnień' });

    if (!req.files || !req.files.length) return res.status(400).json({ message: 'Brak plików do uploadu' });

    // Upload do Cloudinary
    const uploaded = await uploadService.uploadPropertyImages(req.files, id);

    // Merge into property.images (avoid duplicates by filename)
    const existingNames = new Set(property.images.map(i => i.filename));
    uploaded.forEach(f => {
      if (!existingNames.has(f.filename)) {
        property.images.push({ filename: f.filename, isMain: property.images.length === 0 });
      }
    });
    await property.save();
  await property.populate('agent', 'firstName lastName email phone avatar bio experienceYears specializations');

    res.json({ message: 'Zdjęcia dodane', property, uploaded });
  } catch (error) {
    console.error('Error uploading property images:', error);
    res.status(500).json({ message: 'Błąd podczas uploadu zdjęć', error: error.message });
  }
};

// PATCH /api/properties/:id/images/main/:filename - set main image
const setMainPropertyImage = async (req, res) => {
  try {
    const { id, filename } = req.params;
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Nieruchomość nie znaleziona' });

    const isRoot = req.user.role === 'root';
    const isAdmin = req.user.role === 'admin';
    const isOwner = property.agent.toString() === req.user._id.toString();
    if (!isRoot && !isAdmin && !isOwner) return res.status(403).json({ message: 'Brak uprawnień' });

    let found = false;
    property.images.forEach(img => { img.isMain = (img.filename === filename); if (img.isMain) found = true; });
    if (!found) return res.status(404).json({ message: 'Zdjęcie nie znalezione' });
    await property.save();
    res.json({ message: 'Ustawiono główne zdjęcie', property });
  } catch (error) {
    console.error('Error setting main image:', error);
    res.status(500).json({ message: 'Błąd podczas ustawiania głównego zdjęcia', error: error.message });
  }
};

module.exports = {
  getAllProperties,
  getPropertyById,
  getRecentlySoldProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats,
  getStatus,
  uploadPropertyImages,
  setMainPropertyImage
};
