# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, MeView, EventViewSet, MyRegistrationsListView,
    EventRegisterView, EventUnregisterView
)

router = DefaultRouter()
# Регистрируем ViewSet для мероприятий. Базовый URL: /api/events/
# Доступные пути: /api/events/, /api/events/{pk}/, /api/events/{pk}/participants/, /api/events/{pk}/check_in/
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    # Аутентификация и данные пользователя
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('users/me/', MeView.as_view(), name='me'), # Эндпоинт для получения данных о себе

    # Регистрации студента
    path('my-registrations/', MyRegistrationsListView.as_view(), name='my-registrations'),
    path('events/<int:event_pk>/register/', EventRegisterView.as_view(), name='event-register'),
    path('events/<int:event_pk>/unregister/', EventUnregisterView.as_view(), name='event-unregister'),

    # Включаем URL, сгенерированные роутером (для EventViewSet)
    path('', include(router.urls)),
]