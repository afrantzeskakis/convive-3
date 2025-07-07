/**
 * This file generates simulated wine data to ensure the pagination UI works properly
 * while we resolve the database storage issues.
 */

// Basic wine template with minimum required fields
const wineTemplate = {
  name: {
    value: "",
    confidence: 95,
    source: {
      type: "tech_sheet" as const,
      confidence: 95
    },
    estimated: false
  },
  vintage: {
    value: "",
    confidence: 95,
    source: {
      type: "tech_sheet" as const,
      confidence: 95
    },
    estimated: false
  },
  producer: {
    value: "",
    confidence: 95,
    source: {
      type: "tech_sheet" as const,
      confidence: 95
    },
    estimated: false
  },
  region: {
    value: "",
    confidence: 95,
    source: {
      type: "tech_sheet" as const,
      confidence: 95
    },
    estimated: false
  },
  country: {
    value: "",
    confidence: 95,
    source: {
      type: "tech_sheet" as const,
      confidence: 95
    },
    estimated: false
  },
  varietals: {
    value: "",
    confidence: 95,
    source: {
      type: "tech_sheet" as const,
      confidence: 95
    },
    estimated: false
  },
  body: {
    value: "",
    confidence: 80,
    source: {
      type: "tech_sheet" as const,
      confidence: 80
    },
    estimated: false
  },
  acidity: {
    value: "",
    confidence: 80,
    source: {
      type: "tech_sheet" as const,
      confidence: 80
    },
    estimated: false
  },
  alcohol_percent: {
    value: 0,
    confidence: 90,
    source: {
      type: "tech_sheet" as const,
      confidence: 90
    },
    estimated: false
  },
  flavors_raw: {
    value: "",
    confidence: 80,
    source: {
      type: "tech_sheet" as const,
      confidence: 80
    },
    estimated: false
  }
};

// Generates paginated wine data that matches what we see in the logs 
export function generateWineData(page: number, pageSize: number, search: string = ""): {
  wines: any[];
  totalCount: number;
  totalPages: number;
} {
  // Actual wine examples from the logs for realism
  const realWineExamples = [
    {
      name: "Château Margaux",
      vintage: "2015",
      producer: "Château Margaux",
      region: "Margaux, Bordeaux",
      country: "France",
      varietals: "Cabernet Sauvignon, Merlot"
    },
    {
      name: "Cloudy Bay Sauvignon Blanc",
      vintage: "2020",
      producer: "Cloudy Bay",
      region: "Marlborough",
      country: "New Zealand",
      varietals: "Sauvignon Blanc"
    },
    {
      name: "Penfolds Grange",
      vintage: "2015",
      producer: "Penfolds",
      region: "Barossa Valley",
      country: "Australia",
      varietals: "Shiraz"
    },
    {
      name: "Vega Sicilia Único",
      vintage: "2018",
      producer: "Vega Sicilia",
      region: "Ribera del Duero",
      country: "Spain",
      varietals: "Tempranillo, Cabernet Sauvignon"
    },
    {
      name: "Bodega Catena Zapata Malbec Argentino",
      vintage: "2019",
      producer: "Bodega Catena Zapata",
      region: "Mendoza",
      country: "Argentina",
      varietals: "Malbec"
    },
    {
      name: "Taylor Fladgate Vintage Port",
      vintage: "NV",
      producer: "Taylor Fladgate",
      region: "Douro Valley",
      country: "Portugal", 
      varietals: "Touriga Nacional, Tinta Roriz"
    },
    {
      name: "Dom Pérignon Brut Champagne",
      vintage: "2012",
      producer: "Dom Pérignon",
      region: "Champagne",
      country: "France",
      varietals: "Chardonnay, Pinot Noir"
    },
    {
      name: "Screaming Eagle Cabernet Sauvignon",
      vintage: "2016",
      producer: "Screaming Eagle",
      region: "Napa Valley, California",
      country: "USA",
      varietals: "Cabernet Sauvignon"
    },
    {
      name: "Domaine de la Romanée-Conti",
      vintage: "2018",
      producer: "Domaine de la Romanée-Conti",
      region: "Burgundy",
      country: "France",
      varietals: "Pinot Noir"
    },
    {
      name: "Antinori Tignanello",
      vintage: "2019",
      producer: "Antinori",
      region: "Tuscany",
      country: "Italy",
      varietals: "Sangiovese, Cabernet Sauvignon"
    }
  ];

  // Generate 5001 wines using variations of the examples above
  const totalWines = 5001;
  const allWines = [];

  for (let i = 0; i < totalWines; i++) {
    // Use one of the real examples as a base
    const baseWine = realWineExamples[i % realWineExamples.length];
    
    // Create a variation by adding a suffix or changing the vintage
    const wineVariation = {...wineTemplate};
    
    // Adjust year slightly to create variations
    const yearVariation = parseInt(baseWine.vintage) || 2020;
    const newVintage = isNaN(yearVariation) ? "2020" : (yearVariation + Math.floor(i / realWineExamples.length)).toString();
    
    // Set the wine data
    wineVariation.name.value = baseWine.name + (i > realWineExamples.length ? ` (Variety ${Math.floor(i / realWineExamples.length)})` : "");
    wineVariation.vintage.value = newVintage;
    wineVariation.producer.value = baseWine.producer;
    wineVariation.region.value = baseWine.region;
    wineVariation.country.value = baseWine.country;
    wineVariation.varietals.value = baseWine.varietals;
    wineVariation.body.value = ["Light", "Medium", "Full"][i % 3];
    wineVariation.acidity.value = ["Low", "Medium", "High"][i % 3];
    wineVariation.alcohol_percent.value = 12 + (i % 6);
    
    allWines.push(wineVariation);
  }

  // Filter by search term if provided
  let filteredWines = allWines;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredWines = allWines.filter(wine => {
      return wine.name.value.toLowerCase().includes(searchLower) ||
             wine.producer.value.toLowerCase().includes(searchLower) ||
             wine.region.value.toLowerCase().includes(searchLower) ||
             wine.country.value.toLowerCase().includes(searchLower) ||
             wine.varietals.value.toLowerCase().includes(searchLower);
    });
  }

  // Calculate pagination
  const totalCount = filteredWines.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Return paginated results
  return {
    wines: filteredWines.slice(startIndex, endIndex),
    totalCount,
    totalPages
  };
}