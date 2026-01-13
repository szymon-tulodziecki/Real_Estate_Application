const express = require('express');
const router = express.Router();
const uldkService = require('../services/uldkService');

/**
 * GET /api/parcels/by-point
 * Pobiera informacje o działce na podstawie współrzędnych punktu
 */
router.get('/by-point', async (req, res) => {
  try {
    const { x, y, sr } = req.query;

    // Walidacja parametrów
    if (!x || !y) {
      return res.status(400).json({
        success: false,
        message: 'Wymagane parametry: x, y (współrzędne punktu)'
      });
    }

    const coordX = parseFloat(x);
    const coordY = parseFloat(y);

    if (isNaN(coordX) || isNaN(coordY)) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe współrzędne - muszą być liczbami'
      });
    }

    // Sprawdzenie czy współrzędne są w rozsądnym zakresie dla Polski (EPSG:2180)
    if (coordX < 100000 || coordX > 900000 || coordY < 200000 || coordY > 800000) {
      return res.status(400).json({
        success: false,
        message: 'Współrzędne poza zakresem Polski w układzie PUWG 1992'
      });
    }

    console.log(`Searching for parcel at coordinates: ${coordX}, ${coordY}`);

    // Pobierz informacje o działce z ULDK
    const parcelInfo = await uldkService.getParcelByPoint(coordX, coordY);

    if (parcelInfo.success) {
      // Jeśli znaleziono działkę, oblicz centroid jeśli jest geometria
      let centroid = null;
      if (parcelInfo.geometry) {
        centroid = uldkService.calculateCentroid(parcelInfo.geometry);
      }

      // Konwertuj geometrię na GeoJSON jeśli dostępna
      let geoJSON = null;
      if (parcelInfo.geometry) {
        geoJSON = uldkService.wktToGeoJSON(parcelInfo.geometry);
      }

      res.json({
        success: true,
        data: {
          ...parcelInfo,
          centroid: centroid || { x: coordX, y: coordY },
          geoJSON: geoJSON,
          searchPoint: { x: coordX, y: coordY }
        }
      });
    } else {
      res.status(404).json(parcelInfo);
    }
  } catch (error) {
    console.error('Error in /parcels/by-point:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas pobierania danych o działce',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/parcels/:teryt
 * Pobiera szczegółowe informacje o działce na podstawie identyfikatora TERYT
 */
router.get('/:teryt', async (req, res) => {
  try {
    const { teryt } = req.params;

    if (!teryt) {
      return res.status(400).json({
        success: false,
        message: 'Wymagany parametr: teryt (identyfikator działki)'
      });
    }

    console.log(`Getting parcel details for TERYT: ${teryt}`);

    const parcelInfo = await uldkService.getParcelById(teryt);

    if (parcelInfo.success) {
      // Oblicz centroid jeśli jest geometria
      let centroid = null;
      if (parcelInfo.geometry) {
        centroid = uldkService.calculateCentroid(parcelInfo.geometry);
      }

      // Konwertuj geometrię na GeoJSON
      let geoJSON = null;
      if (parcelInfo.geometry) {
        geoJSON = uldkService.wktToGeoJSON(parcelInfo.geometry);
      }

      res.json({
        success: true,
        data: {
          ...parcelInfo,
          centroid,
          geoJSON
        }
      });
    } else {
      res.status(404).json(parcelInfo);
    }
  } catch (error) {
    console.error('Error in /parcels/:teryt:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas pobierania szczegółów działki',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/parcels/validate
 * Waliduje współrzędne i zwraca informacje czy punkt znajduje się w Polsce
 */
router.post('/validate', (req, res) => {
  try {
    const { x, y, sr } = req.body;

    if (!x || !y) {
      return res.status(400).json({
        success: false,
        message: 'Wymagane parametry: x, y'
      });
    }

    const coordX = parseFloat(x);
    const coordY = parseFloat(y);

    if (isNaN(coordX) || isNaN(coordY)) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe współrzędne'
      });
    }

    // Sprawdź zakres dla różnych układów współrzędnych
    let isValid = false;
    let coordinateSystem = 'unknown';

    // EPSG:2180 (PUWG 1992)
    if (coordX >= 100000 && coordX <= 900000 && coordY >= 200000 && coordY <= 800000) {
      isValid = true;
      coordinateSystem = 'EPSG:2180 (PUWG 1992)';
    }
    // EPSG:4326 (WGS84)
    else if (coordX >= 14 && coordX <= 24 && coordY >= 49 && coordY <= 55) {
      isValid = true;
      coordinateSystem = 'EPSG:4326 (WGS84)';
    }

    res.json({
      success: true,
      data: {
        coordinates: { x: coordX, y: coordY },
        isValid,
        coordinateSystem,
        inPoland: isValid
      }
    });
  } catch (error) {
    console.error('Error in /parcels/validate:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd walidacji współrzędnych'
    });
  }
});

module.exports = router;
