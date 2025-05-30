from rest_framework import generics, viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Event, Registration, Tag
from .serializers import TagSerializer
from datetime import timedelta
from .serializers import (
    UserSerializer, RegisterSerializer, EventSerializer, RegistrationSerializer,
    EventRegistrationCreateSerializer, CheckInSerializer, MyRegistrationSerializer
)
from .permissions import IsOrganizer, IsStudent, IsEventOrganizer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя (студента или организатора)"""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,) # Разрешить всем
    serializer_class = RegisterSerializer

class MeView(generics.RetrieveAPIView):
     """Получение данных о текущем пользователе"""
     permission_classes = [permissions.IsAuthenticated]
     serializer_class = UserSerializer

     def get_object(self):
         return self.request.user

class TagViewSet(viewsets.ModelViewSet):
    """API для управления тегами"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        # Читать теги могут все аутентифицированные пользователи
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.AllowAny]
        # Создавать/редактировать/удалять теги могут только организаторы
        else:
            self.permission_classes = [permissions.AllowAny, IsOrganizer]
        return super().get_permissions()

class EventViewSet(viewsets.ModelViewSet):
    """Обновленный API для мероприятий с поддержкой фильтрации по тегам"""
    serializer_class = EventSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.prefetch_related('tags')  # Оптимизация запросов
        
        if user.is_authenticated and user.is_organizer:
            queryset = queryset.filter(
                Q(organizer=user) | Q(dt_start__gte=timezone.now())
            ).distinct()
        else:
            # Студенты и анонимы видят только будущие события
            queryset = queryset.filter(dt_start__gte=timezone.now())

        # Фильтрация по тегам
        tag_filter = self.request.query_params.get('tags', None)
        if tag_filter:
            # Поддерживаем фильтрацию по ID тегов (через запятую)
            try:
                tag_ids = [int(tag_id.strip()) for tag_id in tag_filter.split(',')]
                queryset = queryset.filter(tags__id__in=tag_ids).distinct()
            except ValueError:
                pass  # Игнорируем неверный формат

        # Фильтрация по названиям тегов
        tag_names_filter = self.request.query_params.get('tag_names', None)
        if tag_names_filter:
            tag_names = [name.strip().lower() for name in tag_names_filter.split(',')]
            queryset = queryset.filter(tags__name__in=tag_names).distinct()

        return queryset.order_by('dt_start')

    @action(detail=False, methods=['get'], url_path='popular-tags')
    def popular_tags(self, request):
        """Получить популярные теги (используемые в событиях)"""
        from django.db.models import Count
        
        # Получаем теги, отсортированные по количеству использований
        popular_tags = Tag.objects.annotate(
            usage_count=Count('event')
        ).filter(usage_count__gt=0).order_by('-usage_count')[:10]
        
        serializer = TagSerializer(popular_tags, many=True)
        return Response(serializer.data)


class MyRegistrationsListView(generics.ListAPIView):
    """Получение списка регистраций текущего студента"""
    serializer_class = MyRegistrationSerializer # Используем укороченный сериализатор
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        # Показываем регистрации на будущие и недавние (например, за посл. неделю) события
        past_limit = timezone.now() - timedelta(days=7)
        return Registration.objects.filter(
            student=self.request.user,
            event__dt_start__gte=past_limit
        ).select_related('event').order_by('-event__dt_start')

class EventRegisterView(generics.GenericAPIView):
    """Регистрация текущего студента на мероприятие по ID события"""
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    serializer_class = EventRegistrationCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.context['event'] # Получаем событие из контекста сериализатора

        # Создаем регистрацию
        registration = Registration.objects.create(student=request.user, event=event)
        output_serializer = MyRegistrationSerializer(registration) # Возвращаем данные о созданной регистрации
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class EventUnregisterView(generics.DestroyAPIView):
    """Отмена регистрации текущего студента на мероприятие по ID события"""
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    queryset = Registration.objects.all()
    lookup_field = 'event__id' # Искать будем по ID события
    lookup_url_kwarg = 'event_pk' # Имя параметра в URL

    def get_queryset(self):
        # Ищем только среди регистраций текущего пользователя
        return super().get_queryset().filter(student=self.request.user)

    def perform_destroy(self, instance):
         # Дополнительная проверка: нельзя отменить регистрацию на уже прошедшее событие
        if instance.event.dt_start < timezone.now():
             raise serializers.ValidationError({"detail": "Нельзя отменить регистрацию на прошедшее событие."})
        super().perform_destroy(instance)