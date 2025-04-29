# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
# Импорты для JWT остаются
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Импорты для drf-spectacular
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API эндпоинты вашего приложения
    path('api/', include('api.urls')), # Основные эндпоинты API

    # JWT эндпоинты (можно оставить здесь или перенести в api/urls.py)
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # DRF Spectacular URLs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'), # Генерация схемы OpenAPI (schema.yaml)
    # Опционально: Swagger UI
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Опционально: Redoc UI
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]