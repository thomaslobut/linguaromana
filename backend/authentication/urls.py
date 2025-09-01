from django.urls import path
from . import views

urlpatterns = [
    # Template-based authentication views
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('', views.home_view, name='home'),
    
    # API endpoints for authentication
    path('api/login/', views.api_login, name='api_login'),
    path('api/register/', views.api_register, name='api_register'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/profile/', views.api_user_profile, name='api_user_profile'),
    path('api/submit-quiz/', views.api_submit_quiz_result, name='api_submit_quiz'),
    path('api/stats/', views.api_user_stats, name='api_user_stats'),
]

