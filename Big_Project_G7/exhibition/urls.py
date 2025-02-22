from django.urls import path
from django.contrib.auth import views as auth_view
from . import views

app_name = 'exhibition'
urlpatterns = [
    path('list/', views.exhibition_list, name='exhibition_list'), # 전시회 목록
    path('list/<str:date>/', views.exhibition_list_json, name='exhibition_list_json'), # 전시회 목록
    path('create_exhibition/', views.create_exhibition, name='create_exhibition'),
    path('update/', views.update_booths, name='update'),
    path('booth_list/', views.booth_list, name='booth_list'),
    path('<int:pk>/', views.detail, name='detail'),
    path('<int:pk>/delete/', views.delete, name='delete'),
    path('<int:pk>/edit/', views.edit, name='edit'),
    path('<int:pk>/update/', views.update, name='update'),
    path('save_layout/', views.save_layout, name='save_layout'),
    path('update_exhibition/', views.update_exhibition, name='update_exhibition'),
    path('created_layout/', views.created_layout, name='created_layout'),
]
