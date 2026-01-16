const regions = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", 
  "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", 
  "Sicilia", "Toscana", "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
];

// Level 1 questions: Just finding the region
// Level 2 questions: Find region by Capital (Capoluogo)
const capitals = {
  "L'Aquila": "Abruzzo",
  "Potenza": "Basilicata",
  "Catanzaro": "Calabria",
  "Napoli": "Campania",
  "Bologna": "Emilia-Romagna",
  "Trieste": "Friuli-Venezia Giulia",
  "Roma": "Lazio",
  "Genova": "Liguria",
  "Milano": "Lombardia",
  "Ancona": "Marche",
  "Campobasso": "Molise",
  "Torino": "Piemonte",
  "Bari": "Puglia",
  "Cagliari": "Sardegna",
  "Palermo": "Sicilia",
  "Firenze": "Toscana",
  "Trento": "Trentino-Alto Adige",
  "Perugia": "Umbria",
  "Aosta": "Valle d'Aosta",
  "Venezia": "Veneto"
};

// Level 3 questions: Finding region by Province (Provincia) - Sample subset
const provinces = {
  "Pescara": "Abruzzo",
  "Matera": "Basilicata",
  "Cosenza": "Calabria",
  "Salerno": "Campania",
  "Parma": "Emilia-Romagna",
  "Udine": "Friuli-Venezia Giulia",
  "Viterbo": "Lazio",
  "Savona": "Liguria",
  "Bergamo": "Lombardia",
  "Pesaro e Urbino": "Marche",
  "Isernia": "Molise",
  "Alessandria": "Piemonte",
  "Lecce": "Puglia",
  "Sassari": "Sardegna",
  "Catania": "Sicilia",
  "Pisa": "Toscana",
  "Bolzano": "Trentino-Alto Adige",
  "Terni": "Umbria",
  // Valle d'Aosta has no provinces, it's a single unit roughly
  "Verona": "Veneto"
};

module.exports = { regions, capitals, provinces };
