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
  "Pescara": "Abruzzo", "Chieti": "Abruzzo", "Teramo": "Abruzzo",
  "Matera": "Basilicata",
  "Cosenza": "Calabria", "Crotone": "Calabria", "Reggio Calabria": "Calabria",
  "Salerno": "Campania", "Caserta": "Campania", "Avellino": "Campania", "Benevento": "Campania",
  "Parma": "Emilia-Romagna", "Modena": "Emilia-Romagna", "Ferrara": "Emilia-Romagna", "Rimini": "Emilia-Romagna",
  "Udine": "Friuli-Venezia Giulia", "Pordenone": "Friuli-Venezia Giulia", "Gorizia": "Friuli-Venezia Giulia",
  "Viterbo": "Lazio", "Latina": "Lazio", "Frosinone": "Lazio", "Rieti": "Lazio",
  "Savona": "Liguria", "La Spezia": "Liguria", "Imperia": "Liguria",
  "Bergamo": "Lombardia", "Brescia": "Lombardia", "Como": "Lombardia", "Varese": "Lombardia", "Monza e della Brianza": "Lombardia",
  "Pesaro e Urbino": "Marche", "Macerata": "Marche",
  "Isernia": "Molise",
  "Alessandria": "Piemonte", "Cuneo": "Piemonte", "Novara": "Piemonte", "Asti": "Piemonte",
  "Lecce": "Puglia", "Foggia": "Puglia", "Taranto": "Puglia", "Brindisi": "Puglia",
  "Sassari": "Sardegna", "Nuoro": "Sardegna", "Oristano": "Sardegna",
  "Catania": "Sicilia", "Messina": "Sicilia", "Siracusa": "Sicilia", "Trapani": "Sicilia", "Agrigento": "Sicilia",
  "Pisa": "Toscana", "Siena": "Toscana", "Lucca": "Toscana", "Livorno": "Toscana", "Arezzo": "Toscana",
  "Bolzano": "Trentino-Alto Adige",
  "Terni": "Umbria",
  "Verona": "Veneto", "Padova": "Veneto", "Vicenza": "Veneto", "Treviso": "Veneto"
};

// Level 4 questions: Finding region by Municipality (Comune) - Sample subset
const comuni = {
  "Vasto": "Abruzzo", "Sulmona": "Abruzzo",
  "Melfi": "Basilicata", "Policoro": "Basilicata",
  "Lamezia Terme": "Calabria", "Tropea": "Calabria",
  "Sorrento": "Campania", "Amalfi": "Campania", "Pompei": "Campania",
  "Riccione": "Emilia-Romagna", "Carpi": "Emilia-Romagna", "Imola": "Emilia-Romagna",
  "Lignano Sabbiadoro": "Friuli-Venezia Giulia", "Monfalcone": "Friuli-Venezia Giulia",
  "Civitavecchia": "Lazio", "Cassino": "Lazio", "Ostia": "Lazio",
  "Sanremo": "Liguria", "Portofino": "Liguria", "Rapallo": "Liguria",
  "Vigevano": "Lombardia", "Sesto San Giovanni": "Lombardia", "Crema": "Lombardia",
  "Senigallia": "Marche", "Fabriano": "Marche",
  "Termoli": "Molise", "Venafro": "Molise",
  "Ivrea": "Piemonte", "Alba": "Piemonte", "Rivoli": "Piemonte",
  "Gallipoli": "Puglia", "Ostuni": "Puglia", "Alberobello": "Puglia",
  "Alghero": "Sardegna", "Olbia": "Sardegna", "Porto Cervo": "Sardegna",
  "Taormina": "Sicilia", "Cefalù": "Sicilia", "Marsala": "Sicilia", "Modica": "Sicilia",
  "Viareggio": "Toscana", "Cortona": "Toscana", "Piombino": "Toscana",
  "Rovereto": "Trentino-Alto Adige", "Merano": "Trentino-Alto Adige",
  "Assisi": "Umbria", "Gubbio": "Umbria", "Orvieto": "Umbria", "Spoleto": "Umbria",
  "Courmayeur": "Valle d'Aosta",
  "Chioggia": "Veneto", "Cortina d'Ampezzo": "Veneto", "Jesolo": "Veneto", "Bassano del Grappa": "Veneto"
};

module.exports = { regions, capitals, provinces, comuni };
