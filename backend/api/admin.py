# api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin # Переименуем для ясности
from django.contrib.auth.forms import UserChangeForm, UserCreationForm # Импортируем формы
from .models import User, Event, Registration

# Можно создать кастомные формы, чтобы убедиться, что name используется
class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ('username', 'email', 'password', 'name', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'is_student', 'is_organizer') # Указываем все нужные поля

class CustomUserCreationForm(UserCreationForm):
     class Meta(UserCreationForm.Meta):
        model = User
        # Указываем поля для формы создания, включая 'name'
        fields = ("username", "email", "name", "is_student", "is_organizer") # Пароль обрабатывается UserCreationForm

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin): # Наследуемся от BaseUserAdmin
    # Используем кастомные формы
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    # Переопределяем fieldsets ПОЛНОСТЬЮ
    fieldsets = (
        (None, {"fields": ("username", "password")}), # Стандартная секция пароля/логина
        # Заменяем секцию Personal info на нашу с полем 'name'
        ("Personal info", {"fields": ("name", "email")}),
        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            ),
        }),
        # Наша кастомная секция с ролями
        ("Roles", {"fields": ("is_student", "is_organizer")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    # Переопределяем add_fieldsets ПОЛНОСТЬЮ для формы СОЗДАНИЯ пользователя
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            # Поля из CustomUserCreationForm.Meta.fields, кроме пароля (он обрабатывается формой)
            "fields": ("username", "email", "name", "is_student", "is_organizer"),
        }),
    )

    # Обновляем list_display, чтобы он соответствовал модели
    list_display = ('username', 'email', 'name', 'is_student', 'is_organizer', 'is_staff')
    # Обновляем search_fields
    search_fields = ('username', 'email', 'name')
    # Ordering и filter_horizontal можно оставить из BaseUserAdmin или переопределить
    ordering = ('username',)
    filter_horizontal = (
        "groups",
        "user_permissions",
    )

# Остальные регистрации моделей (Event, Registration) остаются без изменений
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'dt_start', 'location_text', 'max_participants', 'created_at')
    list_filter = ('dt_start', 'organizer')
    search_fields = ('title', 'description', 'location_text')
    autocomplete_fields = ['organizer']

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'event', 'attended', 'registered_at')
    list_filter = ('attended', 'event__dt_start', 'event')
    search_fields = ('student__username', 'student__email', 'event__title', 'id')
    autocomplete_fields = ['student', 'event']
    readonly_fields = ('id', 'registered_at')