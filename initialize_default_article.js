// Script d'initialisation pour charger l'article par défaut
// Ce script doit être exécuté dans la console du navigateur ou intégré à l'application

console.log("🌟 Chargement de l'article par défaut depuis Django...");

// Données de l'article par défaut
const defaultArticleData = [
  {
    "id": "2",
    "title": "Crisis humanitaria en Gaza: Los lanzamientos a\u00e9reos de ayuda generan controversia",
    "content": "La [crisis] [humanitaria] en Gaza ha alcanzado proporciones alarmantes, y los [lanzamientos] [a\u00e9reos] de ayuda se han convertido en una medida desesperada para proporcionar asistencia a la poblaci\u00f3n civil atrapada en el conflicto.\n\nSin embargo, esta forma de entrega de suministros ha generado una gran [controversia] entre organizaciones humanitarias y expertos en ayuda internacional. Mientras algunos argumentan que es la \u00fanica forma viable de hacer llegar alimentos y medicinas a las zonas m\u00e1s afectadas, otros critican que los lanzamientos a\u00e9reos son imprecisos y potencialmente peligrosos.\n\nLos defensores de esta estrategia sostienen que, ante la imposibilidad de acceso terrestre seguro, los lanzamientos a\u00e9reos representan una l\u00ednea de vida crucial para miles de familias. No obstante, los cr\u00edticos se\u00f1alan que esta metodolog\u00eda puede causar m\u00e1s da\u00f1o que beneficio, ya que los suministros pueden caer en zonas inadecuadas o incluso lastimar a civiles.",
    "language": "es",
    "level": "advanced",
    "date": "2025-09-01",
    "summary": "Article sur la crise humanitaire \u00e0 Gaza et les lanzamientos a\u00e9reos de ayuda",
    "keywords": [
      "crisis",
      "humanitaria",
      "lanzamientos",
      "a\u00e9reos",
      "controversia"
    ],
    "status": "published",
    "type": "default",
    "createdAt": "2025-09-01T21:51:14.613817+00:00",
    "updatedAt": "2025-09-01T21:51:14.613817+00:00",
    "isFeatured": true
  }
];

// Charger dans le localStorage
localStorage.setItem('linguaromana_custom_articles', JSON.stringify(defaultArticleData));

console.log("✅ Article par défaut chargé dans le localStorage");
console.log("Rechargez la page pour voir l'article");

// Optionnel: recharger automatiquement la page
// window.location.reload();
