from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views


router = DefaultRouter()
router.register(r"vitals", views.VitalViewSet, basename="vitals")
router.register(r"medications", views.MedicationViewSet, basename="medications")
router.register(r"documents", views.DocumentViewSet, basename="documents")
router.register(r"treatments", views.TreatmentViewSet, basename="treatments")
router.register(r"clients", views.ClientViewSet, basename="clients")
router.register(r"patients", views.PatientViewSet, basename="patients")
router.register(r"appointments", views.AppointmentViewSet, basename="appointments")

urlpatterns = [
    re_path(r"^$", views.ApiRootAPIView.as_view(), name="api-root"),
    path("", include(router.urls)),
    path("login/", views.LoginAPIView.as_view(), name="login"),
    path("doctor/login/", views.DoctorLoginAPIView.as_view(), name="doctor-login"),
    path("register/", views.ClientRegisterAPIView.as_view(), name="register"),
    path("client/register/", views.ClientRegisterAPIView.as_view(), name="client-register"),
    path("token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("dashboard/", views.DashboardAPIView.as_view(), name="dashboard"),
    path("overview-customer/", views.OverviewCustomerAPIView.as_view(), name="overview-customer"),
]
