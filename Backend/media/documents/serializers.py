from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Appointment,
    Client,
    CustomUser,
    Doctor,
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
    if user.is_superuser or user.is_staff or Doctor.objects.filter(user=user).exists():
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

    def _generate_client_id(self):
        last_client = Client.objects.order_by("id").last()
        if last_client is None:
            return "1"
        return str(last_client.id + 1)

    def create(self, validated_data):
        if not validated_data.get("client_id"):
            validated_data["client_id"] = self._generate_client_id()
        return super().create(validated_data)

    class Meta:
        model = Client
        fields = ["id", "client_id", "full_name", "phone", "address", "user", "username", "email"]


class ClientRegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)


class PatientSerializer(serializers.ModelSerializer):

    def _generate_patient_id(self):
        last_patient = Patient.objects.order_by("id").last()
        if last_patient is None:
            return "1"
        return str(last_patient.id + 1)

    def create(self, validated_data):
        if not validated_data.get("patient_id"):
            validated_data["patient_id"] = self._generate_patient_id()
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
        extra_kwargs = {
            "client": {"required": False},
            "patient_id": {"required": False},
        }


class AppointmentSerializer(serializers.ModelSerializer):
    appointment_date = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    status = serializers.CharField(write_only=True, required=False, allow_blank=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)

    def get_patient_name(self, obj):
        return obj.patient.name if getattr(obj, "patient", None) else ""

    def get_client_name(self, obj):
        return obj.client.full_name if getattr(obj, "client", None) else ""

    def validate(self, attrs):
        appointment_date = attrs.pop("appointment_date", None)
        attrs.pop("status", None)
        if not attrs.get("date") and appointment_date:
            attrs["date"] = appointment_date
        if not attrs.get("date"):
            raise ValidationError({"date": ["This field is required."]})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["appointment_date"] = instance.date.isoformat() if instance.date else ""
        data["status"] = "Scheduled"
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
        read_only_fields = ["id", "patient_name", "client_name", "created_at"]


class VitalSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), required=False, allow_null=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    respiratory_rate = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True, write_only=True)
    weight_oz = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True, write_only=True)
    notes = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def get_patient_name(self, obj):
        return obj.patient.name if getattr(obj, "patient", None) else ""

    def validate(self, attrs):
        respiratory_rate = attrs.pop("respiratory_rate", None)
        weight_kg = attrs.pop("weight_kg", None)
        attrs.pop("weight_oz", None)
        attrs.pop("notes", None)
        if respiratory_rate is not None and attrs.get("respiration") is None:
            attrs["respiration"] = respiratory_rate
        if weight_kg is not None and attrs.get("weight_lbs") is None:
            attrs["weight_lbs"] = weight_kg
        return attrs

    class Meta:
        model = Vital
        fields = [
            "id",
            "patient",
            "patient_name",
            "temperature",
            "heart_rate",
            "respiration",
            "respiratory_rate",
            "weight_lbs",
            "weight_kg",
            "weight_oz",
            "recorded_at",
            "notes",
        ]
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
    created_at = serializers.SerializerMethodField(read_only=True)
    document_type = serializers.ChoiceField(choices=Document.document, required=False, allow_null=True)
    issued_date = serializers.DateField(required=False, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True, write_only=True)
    description = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def get_patient_name(self, obj):
        return obj.patient.name if obj.patient_id else ""

    def get_created_at(self, obj):
        return obj.issued_date.isoformat() if obj.issued_date else ""

    def validate(self, attrs):
        title = (attrs.get("title") or "").strip()
        document_type = attrs.get("document_type")
        valid_types = {choice[0] for choice in Document.document}

        if not document_type:
            attrs["document_type"] = title if title in valid_types else "Other"

        attrs.pop("description", None)
        attrs.pop("title", None)

        if not attrs.get("issued_date"):
            attrs["issued_date"] = timezone.localdate()

        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["title"] = instance.document_type
        data["description"] = ""
        return data

    class Meta:
        model = Document
        fields = [
            "id",
            "patient",
            "patient_name",
            "file",
            "document_type",
            "issued_date",
            "title",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "patient_name", "created_at"]


class TreatmentSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), required=False, allow_null=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date = serializers.DateField(write_only=True, required=False, allow_null=True)
    diagnosis = serializers.CharField(required=False, allow_blank=True)
    treatment_description = serializers.CharField(required=False, allow_blank=True)
    follow_up_date = serializers.DateField(required=False, allow_null=True)
    veterinarian = serializers.SerializerMethodField(read_only=True)
    created_at = serializers.SerializerMethodField(read_only=True)

    def get_patient_name(self, obj):
        return obj.patient.name if getattr(obj, "patient", None) else ""

    def get_veterinarian(self, obj):
        return "-"

    def get_created_at(self, obj):
        return obj.follow_up_date.isoformat() if obj.follow_up_date else ""

    def validate(self, attrs):
        patient = attrs.get("patient")
        name = (attrs.pop("name", "") or "").strip()
        description = attrs.pop("description", "")
        date = attrs.pop("date", None)
        attrs.pop("veterinarian", None)

        if not patient:
            raise ValidationError({"patient": ["Patient is required."]})

        if not attrs.get("diagnosis"):
            attrs["diagnosis"] = name
        if not attrs["diagnosis"]:
            raise ValidationError({"name": ["Treatment name is required."]})

        if not attrs.get("treatment_description"):
            attrs["treatment_description"] = description or name

        if not attrs.get("follow_up_date") and date:
            attrs["follow_up_date"] = date

        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["name"] = instance.diagnosis
        data["description"] = instance.treatment_description
        data["date"] = instance.follow_up_date.isoformat() if instance.follow_up_date else ""
        return data

    class Meta:
        model = Treatment
        fields = [
            "id",
            "patient",
            "patient_name",
            "name",
            "description",
            "date",
            "diagnosis",
            "treatment_description",
            "follow_up_date",
            "veterinarian",
            "created_at",
        ]
        read_only_fields = ["id", "patient_name", "veterinarian", "created_at"]
