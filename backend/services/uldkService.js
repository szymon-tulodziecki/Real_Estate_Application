/**
 * ULDK Service - Usługi Udostępniania informacji Lands and Buildings Register
 * Service for handling parcel/land data from ULDK
 */

/**
 * Get parcel information by point coordinates
 * @param {number} x - X coordinate (longitude or PUWG 1992)
 * @param {number} y - Y coordinate (latitude or PUWG 1992)
 * @returns {Promise<Object>} Parcel information
 */
async function getParcelByPoint(x, y) {
  try {
    // TODO: Implement actual ULDK API call
    // This is a placeholder that returns no parcel found
    return {
      success: false,
      message: 'Parcel not found at the specified coordinates',
      coordinates: { x, y }
    };
  } catch (error) {
    console.error('Error getting parcel by point:', error);
    return {
      success: false,
      message: 'Error retrieving parcel information',
      error: error.message
    };
  }
}

/**
 * Get parcel information by TERYT identifier
 * @param {string} teryt - TERYT parcel identifier
 * @returns {Promise<Object>} Parcel information
 */
async function getParcelById(teryt) {
  try {
    // TODO: Implement actual ULDK API call
    // This is a placeholder that returns no parcel found
    return {
      success: false,
      message: 'Parcel not found with the specified TERYT identifier',
      teryt
    };
  } catch (error) {
    console.error('Error getting parcel by ID:', error);
    return {
      success: false,
      message: 'Error retrieving parcel information',
      error: error.message
    };
  }
}

/**
 * Convert WKT (Well-Known Text) geometry to GeoJSON format
 * @param {string} wkt - WKT geometry string
 * @returns {Object} GeoJSON geometry object
 */
function wktToGeoJSON(wkt) {
  try {
    if (!wkt) return null;

    // Simple WKT to GeoJSON converter
    // Handles POINT, LINESTRING, POLYGON, and MULTIPOLYGON

    const trimmed = wkt.trim();

    // POINT
    if (trimmed.startsWith('POINT')) {
      const coords = extractCoordinates(trimmed, 'POINT');
      if (coords.length === 2) {
        return {
          type: 'Point',
          coordinates: coords
        };
      }
    }

    // POLYGON
    if (trimmed.startsWith('POLYGON')) {
      const coordsArray = extractPolygonCoordinates(trimmed);
      return {
        type: 'Polygon',
        coordinates: coordsArray
      };
    }

    // LINESTRING
    if (trimmed.startsWith('LINESTRING')) {
      const coords = extractCoordinates(trimmed, 'LINESTRING');
      return {
        type: 'LineString',
        coordinates: coords
      };
    }

    // MULTIPOLYGON
    if (trimmed.startsWith('MULTIPOLYGON')) {
      const coordsArray = extractMultiPolygonCoordinates(trimmed);
      return {
        type: 'MultiPolygon',
        coordinates: coordsArray
      };
    }

    return null;
  } catch (error) {
    console.error('Error converting WKT to GeoJSON:', error);
    return null;
  }
}

/**
 * Extract coordinates from WKT string
 * @param {string} wkt - WKT string
 * @param {string} type - Geometry type
 * @returns {Array} Coordinates array
 */
function extractCoordinates(wkt, type) {
  const regex = /\(([^)]+)\)/;
  const match = wkt.match(regex);

  if (!match) return [];

  const coordString = match[1];
  const pairs = coordString.split(',');

  return pairs.map(pair => {
    const [x, y] = pair.trim().split(/\s+/);
    return [parseFloat(x), parseFloat(y)];
  });
}

/**
 * Extract polygon coordinates from WKT string
 * @param {string} wkt - WKT POLYGON string
 * @returns {Array} Array of coordinate arrays
 */
function extractPolygonCoordinates(wkt) {
  const innerRegex = /\(\([^)]+\)\)/g;
  const matches = wkt.match(innerRegex);

  if (!matches) return [];

  return matches.map(match => {
    const coordString = match.replace(/[()]/g, '');
    const pairs = coordString.split(',');
    return pairs.map(pair => {
      const [x, y] = pair.trim().split(/\s+/);
      return [parseFloat(x), parseFloat(y)];
    });
  });
}

/**
 * Extract multipolygon coordinates from WKT string
 * @param {string} wkt - WKT MULTIPOLYGON string
 * @returns {Array} Array of polygon coordinate arrays
 */
function extractMultiPolygonCoordinates(wkt) {
  const polygonRegex = /\(\([^)]*(?:\),[^(]*\([^)]*)*\)\)/g;
  const matches = wkt.match(polygonRegex) || [];

  return matches.map(polygon => {
    const innerRegex = /\(([^)]+)\)/g;
    const innerMatches = polygon.match(innerRegex) || [];
    return innerMatches.map(ring => {
      const coordString = ring.replace(/[()]/g, '');
      const pairs = coordString.split(',');
      return pairs.map(pair => {
        const [x, y] = pair.trim().split(/\s+/);
        return [parseFloat(x), parseFloat(y)];
      });
    });
  });
}

/**
 * Calculate centroid of a geometry
 * @param {string|Object} geometry - WKT string or GeoJSON geometry object
 * @returns {Object|null} Centroid coordinates {x, y} or null
 */
function calculateCentroid(geometry) {
  try {
    if (!geometry) return null;

    let geoJSON = geometry;
    if (typeof geometry === 'string') {
      geoJSON = wktToGeoJSON(geometry);
    }

    if (!geoJSON || !geoJSON.type) return null;

    switch (geoJSON.type) {
      case 'Point':
        return {
          x: geoJSON.coordinates[0],
          y: geoJSON.coordinates[1]
        };

      case 'LineString':
        return calculateLineStringCentroid(geoJSON.coordinates);

      case 'Polygon':
        return calculatePolygonCentroid(geoJSON.coordinates[0]);

      case 'MultiPolygon':
        return calculateMultiPolygonCentroid(geoJSON.coordinates);

      default:
        return null;
    }
  } catch (error) {
    console.error('Error calculating centroid:', error);
    return null;
  }
}

/**
 * Calculate centroid of a linestring
 * @param {Array} coords - Array of [x, y] coordinates
 * @returns {Object} Centroid {x, y}
 */
function calculateLineStringCentroid(coords) {
  let x = 0,
    y = 0;
  for (const [lon, lat] of coords) {
    x += lon;
    y += lat;
  }
  return {
    x: x / coords.length,
    y: y / coords.length
  };
}

/**
 * Calculate centroid of a polygon ring
 * @param {Array} coords - Array of [x, y] coordinates forming a ring
 * @returns {Object} Centroid {x, y}
 */
function calculatePolygonCentroid(coords) {
  let area = 0;
  let x = 0;
  let y = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const cross = x0 * y1 - x1 * y0;

    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }

  area /= 2;
  if (area === 0) {
    // Fallback to simple average if area is 0
    return calculateLineStringCentroid(coords);
  }

  return {
    x: x / (6 * area),
    y: y / (6 * area)
  };
}

/**
 * Calculate centroid of multipolygon
 * @param {Array} polygons - Array of polygon coordinate arrays
 * @returns {Object} Centroid {x, y}
 */
function calculateMultiPolygonCentroid(polygons) {
  const centroids = polygons.map(polygon =>
    calculatePolygonCentroid(polygon[0])
  );

  let x = 0,
    y = 0;
  for (const centroid of centroids) {
    x += centroid.x;
    y += centroid.y;
  }

  return {
    x: x / centroids.length,
    y: y / centroids.length
  };
}

module.exports = {
  getParcelByPoint,
  getParcelById,
  wktToGeoJSON,
  calculateCentroid
};
