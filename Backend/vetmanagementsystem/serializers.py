from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Appointment,
    Client,
    Document,
    Medication,
    Patient,
    Treatment,
    Vital,
)

User = get_user_model()


def _user_role(user):
    if not user:
        return "customer"
    if user.is_superuser:
        return "doctor"
    return "customer"


def build_auth_payload(user):
    refresh = RefreshToken.for_user(user)
    client = Client.objects.filter(user=user).first()
    full_name = getattr(user, "get_full_name", lambda: "")() or getattr(user, "username", "")

    if client and client.full_name:
        full_name = client.full_name

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": full_name,
            "role": _user_role(user),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "client_id": client.client_id if client else "",
        },
    }


class ClientRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)


class DoctorRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)


class ClientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    client_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def create(self, validated_data):
        if not validated_data.get("client_id"):
            with transaction.atomic():
                last_client = Client.objects.select_for_update().order_by("id").last()
                validated_data["client_id"] = f"{(last_client.id + 1) if last_client else 1:02d}"
                return super().create(validated_data)
        return super().create(validated_data)

    class Meta:
        model = Client
        fields = ["id", "client_id", "full_name", "phone", "address", "user", "username", "email"]


class PatientSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        if not validated_data.get("patient_id"):
            with transaction.atomic():
                last_patient = Patient.objects.select_for_update().order_by("id").last()
                validated_data["patient_id"] = f"{(last_patient.id + 1) if last_patient else 1:02d}"
                return super().create(validated_data)
        return super().create(validated_data)

    class Meta:
        model = Patient
        fields = [
            "id",
            "name",
            "species",
            "breed",
            "gender",
            "color",
            "date_of_birth",
            "weight_kg",
            "photo",
            "client",
            "patient_id",
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    appointment_date = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)
    status = serializers.SerializerMethodField(read_only=True)

    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.name
        else:
            return ""

    def get_client_name(self, obj):
        if obj.client:
            return obj.client.full_name
        else:
            return ""

    def get_status(self, obj):
        if obj.date < timezone.now():
            return "Completed"
        else:
            return "Scheduled"

    def validate(self, attrs):
        appointment_date = attrs.pop("appointment_date", None)

        if "date" not in attrs and appointment_date is not None:
            attrs["date"] = appointment_date

        if "date" not in attrs:
            raise serializers.ValidationError({"date": ["This field is required."]})

        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.date:
            data["appointment_date"] = instance.date.isoformat()
        else:
            data["appointment_date"] = ""

        return data

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "patient_name",
            "client",
            "client_name",
            "date",
            "location",
            "appointment_date",
            "reason",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "patient_name", "client_name", "status", "created_at"]


class VitalSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), required=False, allow_null=True)
    patient_name = serializers.SerializerMethodField(read_only=True)

    def get_patient_name(self, obj):
        return obj.patient.name if getattr(obj, "patient", None) else ""

    class Meta:
        model = Vital
        fields = ["id", "patient", "patient_name", "temperature", "heart_rate", "respiration", "weight_lbs", "recorded_at"]
        read_only_fields = ["id", "patient_name", "recorded_at"]


class MedicationSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all())
    patient_name = serializers.SerializerMethodField(read_only=True)

    def get_patient_name(self, obj):
        return obj.patient.name if getattr(obj, "patient", None) else ""

    class Meta:
        model = Medication
        fields = ["id", "patient", "patient_name", "name", "dosage", "frequency", "duration", "notes"]


class DocumentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField(read_only=True)
    title = serializers.CharField(required=False, allow_blank=True)
    issued_date = serializers.DateField(required=False, allow_null=True)

    def get_patient_name(self, obj):
        return obj.patient.name if getattr(obj, "patient", None) else ""

    def validate(self, attrs):
        if self.instance:
            if not attrs.get("title"):
                attrs["title"] = self.instance.title or ""
            if not attrs.get("issued_date"):
                attrs["issued_date"] = self.instance.issued_date
            return attrs

        if not attrs.get("title"):
            file_obj = attrs.get("file")
            attrs["title"] = file_obj.name.rsplit(".", 1)[0] if file_obj and getattr(file_obj, "name", "") else "Document"
        if not attrs.get("issued_date"):
            attrs["issued_date"] = timezone.localdate()
        return attrs

    class Meta:
        model = Document
        fields = ["id", "patient", "patient_name", "title", "file", "issued_date"]
        read_only_fields = ["id", "patient_name"]


class TreatmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField(read_only=True)

    def get_patient_name(self, obj):
        return obj.patient.name if getattr(obj, "patient", None) else ""

    class Meta:
        model = Treatment
        fields = ["id", "patient", "patient_name", "diagnosis", "treatment_description", "follow_up_date"]
        read_only_fields = ["id", "patient_name"]
