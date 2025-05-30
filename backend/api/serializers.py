from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from .models import Event, Registration, Tag

User = get_user_model()

class TagSerializer(serializers.ModelSerializer):
    """Сериализатор для тегов"""
    class Meta:
        model = Tag
        fields = ('id', 'name', 'color', 'created_at')
        read_only_fields = ('created_at',)

    def validate_name(self, value):
        name_lower = value.lower().strip()
        # Проверяем наличие дубликатов с игнорированием регистра
        existing_tags = Tag.objects.filter(name__iexact=name_lower)
        if existing_tags.exists():
            # Если обновляем существующий тег, исключаем его из проверки
            if self.instance and self.instance.pk == existing_tags.first().pk:
                return value
            raise serializers.ValidationError("Тег с таким названием уже существует.")
        return value  # ОБЯЗАТЕЛЬНО вернуть значение!

        
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
    """Обновленный сериализатор для мероприятий с поддержкой тегов"""
    organizer = UserSerializer(read_only=True)
    is_registered = serializers.SerializerMethodField(read_only=True)
    spots_left = serializers.SerializerMethodField(read_only=True)
    is_organizer = serializers.SerializerMethodField(read_only=True)
    
    # Поля для работы с тегами
    tags = TagSerializer(many=True, read_only=True)  # Для вывода полной информации о тегах
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Список ID тегов для привязки к событию"
    )
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
        help_text="Список названий тегов (будут созданы автоматически, если не существуют)"
    )

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'dt_start', 'location_text',
            'organizer', 'max_participants', 'created_at',
            'is_registered', 'spots_left', 'is_organizer',
            'tags', 'tag_ids', 'tag_names'  # Новые поля для тегов
        )
        read_only_fields = ('organizer', 'created_at', 'is_registered', 'spots_left', 'is_organizer', 'tags')

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        tag_names = validated_data.pop('tag_names', [])
        
        user = self.context['request'].user  # Получаем пользователя из контекста
        event = Event.objects.create(organizer=user, **validated_data)
        
        self._handle_tags(event, tag_ids, tag_names)
        return event


    def update(self, instance, validated_data):
        # Извлекаем данные о тегах
        tag_ids = validated_data.pop('tag_ids', None)
        tag_names = validated_data.pop('tag_names', None)
        
        # Обновляем основные поля события
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Обрабатываем теги, если они были переданы
        if tag_ids is not None or tag_names is not None:
            self._handle_tags(instance, tag_ids or [], tag_names or [])
        
        return instance

    def _handle_tags(self, event, tag_ids, tag_names):
        """Обрабатывает привязку тегов к событию"""
        tags_to_add = []
        
        # Обрабатываем теги по ID
        if tag_ids:
            existing_tags = Tag.objects.filter(id__in=tag_ids)
            tags_to_add.extend(existing_tags)
        
        # Обрабатываем теги по названиям (создаем если не существуют)
        if tag_names:
            for tag_name in tag_names:
                tag_name_clean = tag_name.lower().strip()
                if tag_name_clean:  # Проверяем, что название не пустое
                    tag, created = Tag.objects.get_or_create(
                        name=tag_name_clean,
                        defaults={'color': '#007bff'}  # Цвет по умолчанию
                    )
                    tags_to_add.append(tag)
        
        # Устанавливаем теги для события
        if tags_to_add:
            event.tags.set(tags_to_add)
        elif tag_ids is not None or tag_names is not None:
            # Если передали пустые списки, очищаем теги
            event.tags.clear()

    def get_is_registered(self, obj):
        user = self.context['request'].user
        if user.is_authenticated and user.is_student:
            return Registration.objects.filter(event=obj, student=user).exists()
        return False

    def get_spots_left(self, obj):
        if obj.max_participants is None:
            return None
        count = Registration.objects.filter(event=obj).count()
        left = obj.max_participants - count
        return left if left >= 0 else 0

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
    # Remove event_id field since we get it from URL
    
    def validate(self, attrs):
        # Get event from URL parameter through the view context
        event_pk = self.context['view'].kwargs.get('event_pk')
        if not event_pk:
            raise serializers.ValidationError("Event ID is required.")
        
        try:
            event = Event.objects.get(pk=event_pk)
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found.")
        
        user = self.context['request'].user
        
        # Check if already registered
        if Registration.objects.filter(student=user, event=event).exists():
            raise serializers.ValidationError("You are already registered for this event.")
        
        # Check capacity
        if event.max_participants and event.registrations.count() >= event.max_participants:
            raise serializers.ValidationError("Event is full.")
        
        # Check if event is in the future
        if event.dt_start <= timezone.now():
            raise serializers.ValidationError("Cannot register for past events.")
        
        # Store event in context for the view to use
        self.context['event'] = event
        return attrs

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