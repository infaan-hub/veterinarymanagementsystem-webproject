from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vetmanagementsystem", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="document",
            old_name="document_type",
            new_name="title",
        ),
        migrations.AlterField(
            model_name="document",
            name="title",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
