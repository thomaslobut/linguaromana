// Script de synchronisation des articles Django vers frontend
// Généré automatiquement - NE PAS MODIFIER MANUELLEMENT

console.log("🔄 Synchronisation des articles depuis Django...");

// Données des articles depuis Django
const articlesData = [
  {
    "id": "2",
    "title": "Crisis humanitaria en Gaza: Los lanzamientos aéreos de ayuda generan controversia",
    "content": "La [crisis] [humanitaria] en Gaza ha alcanzado proporciones alarmantes, y los [lanzamientos] [aéreos] de ayuda se han convertido en una medida desesperada para proporcionar asistencia a la población civil atrapada en el conflicto.\n\nSin embargo, esta forma de entrega de suministros ha generado una gran [controversia] entre organizaciones humanitarias y expertos en ayuda internacional. Mientras algunos argumentan que es la única forma viable de hacer llegar alimentos y medicinas a las zonas más afectadas, otros critican que los lanzamientos aéreos son imprecisos y potencialmente peligrosos.\n\nLos defensores de esta estrategia sostienen que, ante la imposibilidad de acceso terrestre seguro, los lanzamientos aéreos representan una línea de vida crucial para miles de familias. No obstante, los críticos señalan que esta metodología puede causar más daño que beneficio, ya que los suministros pueden caer en zonas inadecuadas o incluso lastimar a civiles.",
    "language": "es",
    "level": "advanced",
    "date": "2025-09-01",
    "summary": "Article advanced en es",
    "keywords": [
      "crisis",
      "humanitaria",
      "lanzamientos",
      "aéreos",
      "controversia"
    ],
    "status": "published",
    "createdAt": "2025-09-01T21:51:14.613817+00:00",
    "updatedAt": "2025-09-01T21:51:14.613817+00:00"
  }
];

// Données des définitions de mots depuis Django
const wordsData = {
  "aéreos": {
    "es": "aéreos",
    "it": "aerei",
    "pt": "aéreos",
    "ca": "aeris",
    "fr": "aériens",
    "grammar": "Adjetivo masculino plural que se refiere a todo lo relacionado con el aire o la aviación.",
    "usage_example": "Los ataques aéreos causaron gran destrucción.",
    "difficulty_level": "intermediate",
    "primary_language": "es"
  },
  "controversia": {
    "es": "controversia",
    "it": "controversia",
    "pt": "controvérsia",
    "ca": "controvèrsia",
    "fr": "controverse",
    "grammar": "Sustantivo femenino que designa una discusión o debate público.",
    "usage_example": "El tema generó una gran controversia en los medios.",
    "difficulty_level": "advanced",
    "primary_language": "es"
  },
  "crisis": {
    "es": "crisis",
    "it": "crisi",
    "pt": "crise",
    "ca": "crisi",
    "fr": "crise",
    "grammar": "Sustantivo femenino invariable que designa una situación grave o difícil.",
    "usage_example": "La crisis humanitaria requiere una respuesta inmediata.",
    "difficulty_level": "intermediate",
    "primary_language": "es"
  },
  "humanitaria": {
    "es": "humanitaria",
    "it": "umanitaria",
    "pt": "humanitária",
    "ca": "humanitària",
    "fr": "humanitaire",
    "grammar": "Adjetivo femenino singular que se refiere a la ayuda y protección de personas.",
    "usage_example": "La ayuda humanitaria es esencial en zonas de conflicto.",
    "difficulty_level": "intermediate",
    "primary_language": "es"
  },
  "lanzamientos": {
    "es": "lanzamientos",
    "it": "lanci",
    "pt": "lançamentos",
    "ca": "llançaments",
    "fr": "largages",
    "grammar": "Sustantivo masculino plural derivado del verbo \"lanzar\".",
    "usage_example": "Los lanzamientos aéreos son una forma de entregar suministros.",
    "difficulty_level": "advanced",
    "primary_language": "es"
  }
};

// Nettoyer les anciennes données
localStorage.removeItem('linguaromana_custom_articles');
localStorage.removeItem('linguaromana_custom_words');

// Charger les nouvelles données
localStorage.setItem('linguaromana_custom_articles', JSON.stringify(articlesData));
localStorage.setItem('linguaromana_custom_words', JSON.stringify(wordsData));

console.log(`✅ {articlesData.length} article(s) synchronisé(s)`);
console.log(`✅ {Object.keys(wordsData).length} définition(s) de mots synchronisée(s)`);

console.log("📊 Statistiques articles:");
articlesData.forEach((article, index) => {
    console.log(`   {index + 1}. {article.title} ({article.language}, {article.level})`);
});

console.log("🔤 Définitions de mots:");
Object.keys(wordsData).forEach((word, index) => {
    console.log(`   {index + 1}. {word} ({wordsData[word].primary_language}, {wordsData[word].difficulty_level})`);
});

console.log("\n✅ Données synchronisées dans localStorage");
// Note: Pas de rechargement automatique pour éviter les boucles infinies lors de l'auto-sync
