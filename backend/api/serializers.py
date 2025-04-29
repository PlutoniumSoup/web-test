from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from .models import Event, Registration

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Для отображения информации о пользователе"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'name', 'is_organizer', 'is_student')

class RegisterSerializer(serializers.ModelSerializer):
    """Для регистрации нового пользователя"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    is_organizer = serializers.BooleanField(default=False, required=False) # По умолчанию регистрируется студент

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'name', 'is_organizer')
        extra_kwargs = {
            'name': {'required': False},
             # Email должен быть уникальным
            'email': {'required': True, 'allow_blank': False}
        }

    def validate_email(self, value):
        # Проверка уникальности email при регистрации
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        # Правильно устанавливаем роли при создании
        user = User(**validated_data)
        user.is_student = not validated_data.get('is_organizer', False)
        user.save() # Метод save в модели User обработает is_staff
        return user

class EventSerializer(serializers.ModelSerializer):
    """Для списка и деталей мероприятий"""
    organizer = UserSerializer(read_only=True)
    is_registered = serializers.SerializerMethodField(read_only=True)
    spots_left = serializers.SerializerMethodField(read_only=True)
    is_organizer = serializers.SerializerMethodField(read_only=True) # Является ли текущий юзер организатором ЭТОГО события

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'dt_start', 'location_text',
            'organizer', 'max_participants', 'created_at',
            'is_registered', 'spots_left', 'is_organizer'
        )
        # Поля, которые заполняются автоматически или не редактируются напрямую
        read_only_fields = ('organizer', 'created_at', 'is_registered', 'spots_left', 'is_organizer')

    def get_is_registered(self, obj):
        user = self.context['request'].user
        if user.is_authenticated and user.is_student:
            return Registration.objects.filter(event=obj, student=user).exists()
        return False

    def get_spots_left(self, obj):
        if obj.max_participants is None:
            return None # Бесконечно
        # Считаем подтвержденные регистрации для события
        count = Registration.objects.filter(event=obj).count()
        left = obj.max_participants - count
        return left if left >= 0 else 0 # Не может быть меньше 0

    def get_is_organizer(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and obj.organizer == user

class RegistrationSerializer(serializers.ModelSerializer):
    """Для отображения информации о регистрации (в ЛК студента или организатора)"""
    # Вкладываем информацию о событии и студенте
    event = EventSerializer(read_only=True)
    student = UserSerializer(read_only=True)

    class Meta:
        model = Registration
        fields = ('id', 'student', 'event', 'registered_at', 'attended')

class MyRegistrationSerializer(serializers.ModelSerializer):
     """Для ЛК студента - краткая информация о событии + QR"""
     event_title = serializers.CharField(source='event.title', read_only=True)
     event_dt_start = serializers.DateTimeField(source='event.dt_start', read_only=True)
     event_location = serializers.CharField(source='event.location_text', read_only=True)
     qr_code_data = serializers.SerializerMethodField()

     class Meta:
         model = Registration
         fields = ('id', 'event_title', 'event_dt_start', 'event_location', 'attended', 'qr_code_data')

     def get_qr_code_data(self, obj):
         # Данные для QR-кода - просто UUID регистрации
         return str(obj.id)


class EventRegistrationCreateSerializer(serializers.Serializer):
    """Сериализатор для СОЗДАНИЯ регистрации студентом (принимает event_id)"""
    # Не наследуемся от ModelSerializer, т.к. нам не нужно поле student из запроса
    event_id = serializers.IntegerField(write_only=True)

    def validate_event_id(self, event_id):
        user = self.context['request'].user
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            raise serializers.ValidationError("Мероприятие не найдено.")

        # Проверка, что событие еще не прошло
        if event.dt_start < timezone.now():
             raise serializers.ValidationError("Регистрация на прошедшее мероприятие невозможна.")

        # Проверка, что пользователь еще не зарегистрирован
        if Registration.objects.filter(event=event, student=user).exists():
            raise serializers.ValidationError("Вы уже зарегистрированы на это событие.")

        # Проверка свободных мест (с блокировкой для атомарности)
        if event.max_participants is not None:
            try:
                with transaction.atomic():
                    # Блокируем строку события на время проверки и создания регистрации
                    event_locked = Event.objects.select_for_update().get(pk=event.pk)
                    if Registration.objects.filter(event=event_locked).count() >= event_locked.max_participants:
                        raise serializers.ValidationError("К сожалению, все места заняты.")
            except Exception as e: # Ловим возможные ошибки блокировки или другие
                 # Логируем ошибку e
                 print(f"Transaction error during registration check: {e}")
                 raise serializers.ValidationError("Произошла ошибка при проверке мест. Попробуйте еще раз.")

        # Сохраняем валидный объект Event в контекст сериализатора для view
        self.context['event'] = event
        return event_id

class CheckInSerializer(serializers.Serializer):
    """Сериализатор для отметки посещения (принимает registration_id)"""
    registration_id = serializers.UUIDField(required=True)

    def validate_registration_id(self, registration_id):
        # Получаем событие из URL (должно быть передано во view)
        event = self.context['event']
        try:
            registration = Registration.objects.get(pk=registration_id)
        except Registration.DoesNotExist:
            raise serializers.ValidationError("Регистрация с таким ID не найдена.")

        # Проверяем, относится ли регистрация к ТЕКУЩЕМУ событию
        if registration.event != event:
            raise serializers.ValidationError("Этот QR-код от другого мероприятия.")

        # Проверяем, не был ли студент уже отмечен
        if registration.attended:
            raise serializers.ValidationError(f"Студент {registration.student.name or registration.student.username} уже отмечен.")

        # Сохраняем объект регистрации для использования во view
        self.context['registration'] = registration
        return registration_id