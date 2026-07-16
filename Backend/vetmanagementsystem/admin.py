from django.contrib import admin
from .models import (
    CustomUser, Client, Patient, Appointment, Vital, Medication, Document, Treatment
)

admin.site.register(CustomUser)
admin.site.register(Client)
admin.site.register(Patient)
admin.site.register(Appointment)
admin.site.register(Vital)
admin.site.register(Medication)
admin.site.register(Document)
admin.site.register(Treatment)
