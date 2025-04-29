from rest_framework import generics, viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q # <--- ДОБАВЬТЕ ЭТОТ ИМПОРТ

from .models import Event, Registration # Модели вашего приложения уже импортированы
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

class EventViewSet(viewsets.ModelViewSet):
    """API для мероприятий (CRUD для организаторов, Read для всех)"""
    serializer_class = EventSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_organizer:
            # Теперь 'Q' будет распознано
            return Event.objects.filter(
                Q(organizer=user) | Q(dt_start__gte=timezone.now())
            ).distinct().order_by('dt_start')
        # Студенты и анонимы видят только будущие события
        return Event.objects.filter(dt_start__gte=timezone.now()).order_by('dt_start')

    def get_permissions(self):
        # Создавать может только организатор
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated, IsOrganizer]
        # Редактировать/удалять может только организатор ЭТОГО события
        elif self.action in ['update', 'partial_update', 'destroy', 'participants', 'check_in']:
            # IsEventOrganizer проверяет права на уровне объекта
            self.permission_classes = [permissions.IsAuthenticated, IsEventOrganizer]
        # Смотреть список/детали могут все (даже анонимы)
        else: # list, retrieve
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

    def perform_create(self, serializer):
        # Автоматически назначаем организатором текущего пользователя
        serializer.save(organizer=self.request.user)

    # Доп. эндпоинт: GET /api/events/{event_pk}/participants/
    @action(detail=True, methods=['get'], url_path='participants')
    def participants(self, request, pk=None):
        """Получить список зарегистрированных на мероприятие (для организатора)"""
        event = self.get_object() # Проверка прав IsEventOrganizer уже произошла
        registrations = Registration.objects.filter(event=event).select_related('student')
        serializer = RegistrationSerializer(registrations, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    # Доп. эндпоинт: POST /api/events/{event_pk}/check_in/
    @action(detail=True, methods=['post'], url_path='check_in')
    def check_in(self, request, pk=None):
        """Отметить посещение студента по QR (UUID регистрации)"""
        event = self.get_object() # Проверка прав IsEventOrganizer
        serializer = CheckInSerializer(data=request.data, context={'event': event}) # Передаем событие в контекст
        serializer.is_valid(raise_exception=True)

        # Получаем объект регистрации из валидного сериализатора
        registration = serializer.context['registration']
        registration.attended = True
        registration.save()

        student_info = registration.student.name or registration.student.username
        return Response(
            {"message": f"Студент {student_info} успешно отмечен!", "registration": RegistrationSerializer(registration).data},
            status=status.HTTP_200_OK
        )

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