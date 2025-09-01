from datetime import date

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from authentication.models import Article, Badge, QuizQuestion, UserProfile


class Command(BaseCommand):
    help = "Setup initial data for LinguaRomana"

    def handle(self, *args, **options):
        # Create sample article
        article, created = Article.objects.get_or_create(
            id=1,
            defaults={
                "title": "Crisis humanitaria en Gaza: Los lanzamientos aéreos de ayuda generan controversia",
                "content": """Los países árabes están realizando lanzamientos aéreos de ayuda humanitaria sobre Gaza. 
Sin embargo, estas operaciones han generado controversia porque muchos expertos y organizaciones consideran que no son efectivas.

Según testigos locales, estos lanzamientos pueden ser peligrosos. Un activista palestino declaró que estas operaciones "no son ayuda real, solo son fotos que engañan". 

La situación humanitaria en Gaza sigue siendo devastadora, con escasez de alimentos y medicinas. Los habitantes de la región necesitan una solución más efectiva y segura para recibir ayuda.

Las autoridades internacionales están estudiando alternativas más seguras para hacer llegar la ayuda humanitaria a la población civil de Gaza.""",
                "language": "es",
                "level": "intermediate",
                "publication_date": date.today(),
                "is_active": True,
            },
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created article: {article.title}"))

            # Create quiz questions for the article
            questions_data = [
                {
                    "question_text": "¿Qué opinan los expertos sobre los lanzamientos aéreos?",
                    "option_a": "Son muy efectivos",
                    "option_b": "No son efectivos",
                    "option_c": "Son la mejor solución",
                    "option_d": "Son baratos",
                    "correct_option": "B",
                },
                {
                    "question_text": "Según el activista palestino, ¿qué son realmente estos lanzamientos?",
                    "option_a": "Ayuda real",
                    "option_b": "Fotos que engañan",
                    "option_c": "Una solución perfecta",
                    "option_d": "Un programa exitoso",
                    "correct_option": "B",
                },
                {
                    "question_text": "¿Cómo se describe la situación humanitaria en Gaza?",
                    "option_a": "Está mejorando",
                    "option_b": "Es normal",
                    "option_c": "Es devastadora",
                    "option_d": "Es excelente",
                    "correct_option": "C",
                },
            ]

            for q_data in questions_data:
                QuizQuestion.objects.create(article=article, **q_data)

            self.stdout.write(
                self.style.SUCCESS(f"Created {len(questions_data)} quiz questions")
            )
        else:
            self.stdout.write(self.style.WARNING("Article already exists"))

        # Create demo users if they don't exist
        demo_users = [
            {
                "username": "demo",
                "email": "demo@linguaromana.com",
                "password": "demo123",
                "preferred_language": "es",
            },
            {
                "username": "testuser",
                "email": "test@linguaromana.com",
                "password": "test123",
                "preferred_language": "fr",
            },
        ]

        for user_data in demo_users:
            if not User.objects.filter(username=user_data["username"]).exists():
                user = User.objects.create_user(
                    username=user_data["username"],
                    email=user_data["email"],
                    password=user_data["password"],
                )

                UserProfile.objects.create(
                    user=user,
                    preferred_language=user_data["preferred_language"],
                    current_streak=5,
                    total_points=150,
                    level=2,
                )

                self.stdout.write(
                    self.style.SUCCESS(f"Created demo user: {user.username}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"User {user_data['username']} already exists")
                )

        # Create default badges
        badges_data = [
            {
                "name": "Premier Pas",
                "description": "Complétez votre premier quiz",
                "icon": "🎯",
                "points_required": 0,
                "quiz_count_required": 1,
                "streak_required": 0,
            },
            {
                "name": "Étudiant Assidu",
                "description": "Gagnez 100 points",
                "icon": "📚",
                "points_required": 100,
                "quiz_count_required": 0,
                "streak_required": 0,
            },
            {
                "name": "Série de 3",
                "description": "Maintenez une série de 3 jours",
                "icon": "🔥",
                "points_required": 0,
                "quiz_count_required": 0,
                "streak_required": 3,
            },
            {
                "name": "Expert",
                "description": "Gagnez 500 points",
                "icon": "🏆",
                "points_required": 500,
                "quiz_count_required": 0,
                "streak_required": 0,
            },
            {
                "name": "Série de 7",
                "description": "Maintenez une série de 7 jours",
                "icon": "⚡",
                "points_required": 0,
                "quiz_count_required": 0,
                "streak_required": 7,
            },
            {
                "name": "Maître Linguiste",
                "description": "Gagnez 1000 points",
                "icon": "👑",
                "points_required": 1000,
                "quiz_count_required": 0,
                "streak_required": 0,
            },
        ]

        created_badges = 0
        for badge_data in badges_data:
            badge, created = Badge.objects.get_or_create(
                name=badge_data["name"], defaults=badge_data
            )
            if created:
                created_badges += 1

        if created_badges > 0:
            self.stdout.write(self.style.SUCCESS(f"Created {created_badges} badges"))
        else:
            self.stdout.write(self.style.WARNING("All badges already exist"))

        self.stdout.write(self.style.SUCCESS("Initial data setup completed!"))
