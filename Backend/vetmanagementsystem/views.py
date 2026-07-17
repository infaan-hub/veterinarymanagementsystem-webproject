from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError, transaction
import re
from rest_framework import status
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import (
    Appointment,
    Client,
    Document,
    Medication,
    Patient,
    Treatment,
    Vital,
)
from .serializers import (
    AppointmentSerializer,
    ClientRegisterSerializer,
    ClientSerializer,
    DocumentSerializer,
    MedicationSerializer,
    PatientSerializer,
    TreatmentSerializer,
    VitalSerializer,
    build_auth_payload,
)

User = get_user_model()


class IsDoctorFullClientReadOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return request.method in SAFE_METHODS


class IsClientFullDoctorReadOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return request.method in SAFE_METHODS
        return True


def _client_for_user(user):
    if not user.is_authenticated:
        return None
    return Client.objects.filter(user=user).first()


def _require_client(user):
    client = _client_for_user(user)
    if not client:
        raise ValidationError({"detail": "Client not found for this user."})
    return client


def _is_doctor_user(user):
    return bool(user and user.is_superuser)


def _generate_client_id():
    last_value = 0
    for value in Client.objects.select_for_update().values_list("client_id", flat=True):
        match = re.search(r"(\d+)$", str(value or ""))
        if match:
            last_value = max(last_value, int(match.group(1)))
    return f"{last_value + 1:02d}"


def _client_filter_kwargs(user):
    if user.is_staff:
        return {}
    client = _client_for_user(user)
    if client:
        return {"client": client}
    return {"client__id": -1}


class ClientRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ClientRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=data["username"],
                    email=data["email"],
                    password=data["password"],
                )
                Client.objects.create(
                    user=user,
                    client_id=_generate_client_id(),
                    full_name=data["full_name"],
                    phone=data.get("phone", ""),
                    address=data.get("address", ""),
                )
        except IntegrityError:
            return Response({"detail": "Username or email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Registration successful"}, status=status.HTTP_201_CREATED)


class DoctorRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(
            {"detail": "Doctor registration is not available. Doctor accounts are created by administrators only."},
            status=status.HTTP_403_FORBIDDEN,
        )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        user = authenticate(request, username=username, password=password)

        if not user:
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(build_auth_payload(user), status=status.HTTP_200_OK)


class DoctorLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        user = authenticate(request, username=username, password=password)

        if not user:
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_superuser:
            return Response({"detail": "This account is not a doctor."}, status=status.HTTP_403_FORBIDDEN)

        return Response(build_auth_payload(user), status=status.HTTP_200_OK)


class ClientViewSet(ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Client.objects.select_related("user").all()
        client = _client_for_user(user)
        if client:
            return Client.objects.select_related("user").filter(id=client.id)
        return Client.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
            return
        if _client_for_user(self.request.user):
            raise ValidationError({"detail": "Client profile already exists for this user."})
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
            return
        serializer.save(user=self.request.user)


ClientRegistrationView = ClientRegisterAPIView


class PatientViewSet(ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Patient.objects.select_related("client", "client__user").all()
        return Patient.objects.select_related("client", "client__user").filter(**_client_filter_kwargs(user))

    def perform_create(self, serializer):
        client = serializer.validated_data.get("client")
        if self.request.user.is_staff and client:
            serializer.save()
            return
        serializer.save(client=_require_client(self.request.user))

    def perform_update(self, serializer):
        client = serializer.validated_data.get("client")
        if self.request.user.is_staff and client:
            serializer.save()
            return
        serializer.save(client=_require_client(self.request.user))


class AppointmentViewSet(ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base = Appointment.objects.select_related("client", "patient")
        if user.is_staff:
            return base.all()
        return base.filter(**_client_filter_kwargs(user))

    def perform_create(self, serializer):
        client = serializer.validated_data.get("client")
        if not client:
            client = _require_client(self.request.user)
        patient = serializer.validated_data.get("patient")
        if patient and patient.client_id != client.id:
            raise ValidationError({"patient": ["This patient does not belong to the authenticated client."]})
        serializer.save(client=client)

    def perform_update(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
            return
        serializer.save(client=_require_client(self.request.user))


class VitalViewSet(ModelViewSet):
    serializer_class = VitalSerializer
    permission_classes = [IsDoctorFullClientReadOnly]

    def get_queryset(self):
        user = self.request.user
        base = Vital.objects.select_related("patient", "patient__client")
        if user.is_superuser:
            return base.all()
        return base.filter(patient__client=_client_for_user(user))


class MedicationViewSet(ModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [IsDoctorFullClientReadOnly]

    def get_queryset(self):
        user = self.request.user
        base = Medication.objects.select_related("patient", "patient__client")
        if user.is_superuser:
            return base.all()
        return base.filter(patient__client=_client_for_user(user))


class DocumentViewSet(ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsDoctorFullClientReadOnly]

    def get_queryset(self):
        user = self.request.user
        base = Document.objects.select_related("patient", "patient__client")
        if user.is_superuser:
            return base.all()
        return base.filter(patient__client=_client_for_user(user))


class TreatmentViewSet(ModelViewSet):
    serializer_class = TreatmentSerializer
    permission_classes = [IsDoctorFullClientReadOnly]

    def get_queryset(self):
        user = self.request.user
        base = Treatment.objects.select_related("patient", "patient__client")
        if user.is_superuser:
            return base.all()
        return base.filter(patient__client=_client_for_user(user))


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser:
            return Response({
                "dashboard_for": "doctor",
                "patients_count": Patient.objects.count(),
                "appointments_count": Appointment.objects.count(),
            })

        client = _client_for_user(user)
        if not client:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "dashboard_for": "client",
            "patients_count": Patient.objects.filter(client=client).count(),
            "appointments_count": Appointment.objects.filter(client=client).count(),
        })


class OverviewCustomerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = _client_for_user(request.user)
        if not client:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

        patients = Patient.objects.filter(client=client)

        return Response({
            "patients": PatientSerializer(patients, many=True).data,
            "appointments": AppointmentSerializer(
                Appointment.objects.filter(client=client).select_related("patient", "client"),
                many=True,
            ).data,
            "vitals": VitalSerializer(Vital.objects.filter(patient__in=patients), many=True).data,
            "medications": MedicationSerializer(Medication.objects.filter(patient__in=patients), many=True).data,
            "documents": DocumentSerializer(Document.objects.filter(patient__in=patients), many=True).data,
            "treatments": TreatmentSerializer(Treatment.objects.filter(patient__in=patients), many=True).data,
        })


class ApiRootAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        endpoints = {
            "login": "/api/login/",
            "doctor_login": "/api/doctor/login/",
            "register": "/api/register/",
            "client_register": "/api/client/register/",
            "token": "/api/token/",
            "token_refresh": "/api/token/refresh/",
            "dashboard": "/api/dashboard/",
            "overview_customer": "/api/overview-customer/",
            "clients": "/api/clients/",
            "patients": "/api/patients/",
            "appointments": "/api/appointments/",
            "vitals": "/api/vitals/",
            "medications": "/api/medications/",
            "documents": "/api/documents/",
            "treatments": "/api/treatments/",
        }
        return Response(endpoints)
