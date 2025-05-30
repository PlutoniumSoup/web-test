from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import uuid # Для уникальности QR

class User(AbstractUser):
    # Убираем стандартные first/last name, используем одно поле name
    first_name = None
    last_name = None
    name = models.CharField("Полное имя", max_length=150, blank=True)
    is_student = models.BooleanField(default=True)
    is_organizer = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
         # Гарантируем, что пользователь либо студент, либо организатор (не оба и не ни один)
        if self.is_organizer:
            self.is_student = False
            self.is_staff = True # Организаторы могут иметь доступ к админке (опционально)
        else:
            self.is_student = True
        super().save(*args, **kwargs)

# Добавляем новую модель для тегов
class Tag(models.Model):
    name = models.CharField("Название тега", max_length=50, unique=True)
    color = models.CharField("Цвет тега", max_length=7, default="#007bff", 
                           help_text="Цвет в формате HEX (например, #ff0000)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Тег"
        verbose_name_plural = "Теги"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Приводим название тега к нижнему регистру для унификации
        # self.name = self.name.strip().lower()
        super().save(*args, **kwargs)

# Обновляем модель Event
class Event(models.Model):
    title = models.CharField("Название", max_length=200)
    description = models.TextField("Описание", blank=True)
    dt_start = models.DateTimeField("Дата и время начала")
    location_text = models.CharField("Место проведения (текст)", max_length=255)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='organized_events',
        on_delete=models.CASCADE,
        verbose_name="Организатор",
        limit_choices_to={'is_organizer': True}
    )
    max_participants = models.PositiveIntegerField(
        "Макс. участников", null=True, blank=True,
        help_text="Оставьте пустым для неограниченного количества"
    )
    # НОВОЕ ПОЛЕ - связь многие-ко-многим с тегами
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        verbose_name="Теги",
        help_text="Выберите теги для категоризации мероприятия"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"
        ordering = ['dt_start']

    def __str__(self):
        return self.title

    def get_tag_names(self):
        """Возвращает список названий тегов"""
        return [tag.name for tag in self.tags.all()]

class Registration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) # Уникальный ID для QR
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='registrations',
        on_delete=models.CASCADE,
        verbose_name="Студент",
        limit_choices_to={'is_student': True}
    )
    event = models.ForeignKey(
        Event,
        related_name='registrations',
        on_delete=models.CASCADE,
        verbose_name="Мероприятие"
    )
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField("Посетил(а)", default=False)

    class Meta:
        verbose_name = "Регистрация"
        verbose_name_plural = "Регистрации"
        # Уникальность: один студент на одно мероприятие
        unique_together = ('student', 'event')
        ordering = ['-registered_at']

    def __str__(self):
        status = "Посетил" if self.attended else "Зарегистрирован"
        return f"{self.student.username} на {self.event.title} ({status})"