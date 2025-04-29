from rest_framework import permissions

class IsOrganizer(permissions.BasePermission):
    message = "Доступ разрешен только организаторам."
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_organizer

class IsStudent(permissions.BasePermission):
    message = "Доступ разрешен только студентам."
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_student

class IsEventOrganizer(permissions.BasePermission):
    message = "Вы не являетесь организатором этого мероприятия."
    # Проверка на уровне объекта (конкретного события)
    def has_object_permission(self, request, view, obj):
        # obj здесь это Event
        return obj.organizer == request.user
