from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils.crypto import get_random_string
import re
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError
from twilio.rest import Client
from django.core.mail import send_mail
from django.conf import settings
import logging
import os
import requests

logger = logging.getLogger(__name__)

CustomUser  = get_user_model()

def send_email(email, otp):
    """Sends an OTP via email."""
    try:
        send_mail(
            subject="Your OTP for Login",
            message=f"Your OTP is: {otp}",
            from_email=settings.DEFAULT_FROM_EMAIL,  # Set this in settings.py
            recipient_list=[email],
            fail_silently=False
        )
        print(f"Email sent successfully to {email}")
    except Exception as e:
        print(f"Error sending email: {e}")


def send_sms(mobile_number, otp, message_type="signup"):
    """Sends an SMS using SpringEdge."""
    try:
        # API endpoint provided by SpringEdge
        API_URL = "https://instantalerts.co/api/web/send"

        # SpringEdge credentials come from the environment. The previous hardcoded key was
        # committed to a public repository and has been rotated - do not reintroduce it here.
        API_KEY = os.environ.get("SPRINGEDGE_API_KEY")
        SENDER_ID = os.environ.get("SPRINGEDGE_SENDER_ID", "STRPAT")

        if not API_KEY:
            logger.error("SPRINGEDGE_API_KEY is not set; cannot send OTP SMS")
            return False

        # Template messages
        templates = {
            "signup": "Dear User, Your signup OTP is {otp} from Only2Bali. Best regards, Straits Partners",
            "signin": "Dear User, Your sign-in OTP is {otp} from Only2Bali. Best regards, Straits Partners"
        }

        # Select the appropriate message template and insert OTP
        message = templates.get(message_type, "Invalid message type").format(otp=otp)

        # URL encode the message
        message_encoded = requests.utils.quote(message)

        # Construct the full URL with query parameters
        url = f"{API_URL}?apikey={API_KEY}&sender={SENDER_ID}&to={mobile_number}&message={message_encoded}"

        # Send the request to SpringEdge
        response = requests.post(url)

        # Check if the request was successful
        if response.status_code == 200:
            print(f"SMS sent successfully to {mobile_number}: {message}")
            return True
        else:
            print(f"Failed to send SMS. Response: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return False




# def send_sms(mobile_number, message):
#     """Sends an SMS using Twilio."""
#     try:
#         client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
#         client.messages.create(
#             body=message,
#             from_=settings.TWILIO_PHONE_NUMBER,
#             to=mobile_number
#         )
#         print(f"SMS sent successfully to {mobile_number}:{message}")
#     except Exception as e:
#         print(f"Error sending SMS: {e}")

# Dummy function to simulate sending SMS (for local testing)
# def send_sms(mobile_number, message):
#     print(f"Simulating SMS sending to {mobile_number}: {message}")

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username','email', 'mobile_number','gender','dob']  # Add other fields you need

class RegistrationSerializer(serializers.Serializer):
    """Serializer for validating user registration details."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    mobile_number = serializers.CharField(max_length=15)
    password_confirmation = serializers.CharField(write_only=True)
    dob=serializers.DateField()
    gender=serializers.CharField(max_length=10)
        
    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_ ]{3,20}$', value):
            raise ValidationError('Username must be alphanumeric and between 3 to 20 characters.')


    def validate_mobile_number(self, value):
        if not re.match (r'^\+?[1-9]\d{1,14}$', value):  # E.164 format validation
            raise serializers.ValidationError("Invalid mobile number format.")
        return value
    
    def validate_password(self, value):
        # Allow letters, numbers, underscores, spaces, and special characters
        if not re.match(r'^[a-zA-Z0-9_ !@#$%^&*()\-_=+\[\]{}|;:,.<>?]{8,20}$', value):
            raise ValidationError('Password must be atleast 8 characters ')
        return value

    def validate(self, data):

        if CustomUser .objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Username is already in use."})
        
        if CustomUser .objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email is already in use."})
        
        if CustomUser .objects.filter(mobile_number=data['mobile_number']).exists():
            raise serializers.ValidationError({"mobile_number": "Mobile number is already registered."})

        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({"password_confirmation": "Passwords do not match."})

        return data

class OTPVerificationSerializer(serializers.Serializer):
    """Serializer for verifying OTP and creating user."""
    
    otp = serializers.CharField(max_length=4)

    def validate(self, data):
        mobile_number = self.context.get('mobile_number')
        # mobile_number = self.context['view'].kwargs.get('mobile_number')
        otp = data.get("otp")

        if not mobile_number or not otp:
            raise serializers.ValidationError({"error": "Missing required fields."})

        cache_key = f"otp_{mobile_number}"
        user_data = cache.get(cache_key)
        if not user_data:
            raise serializers.ValidationError({"error": "OTP expired or invalid."})

        if user_data.get("otp") != otp:
            raise serializers.ValidationError({"error": "Invalid OTP."})

        return data

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetVerifySerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        new_password = data['new_password']
        confirm_password = data['confirm_password']
        
        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        try:
            password_validation.validate_password(new_password)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": e.messages})

        return data

class LoginSerializer(serializers.Serializer):
    """Serializer for login requests."""
    identifier = serializers.CharField(max_length=150)  # Email or mobile number
    password = serializers.CharField(write_only=True, required=False)
    otp = serializers.CharField(write_only=True, required=False)
    login_type = serializers.ChoiceField(choices=['password', 'otp'])


# CustomUserSerializer

# For retrieving user details (e.g., profile, listing users).
# Includes all fields like id, username, email, mobile_number, and is_verified.

# RegistrationSerializer

# Validates the input during registration (username, email, password, mobile number).
# Ensures that the email and mobile number are unique.

# OTPVerificationSerializer

# Verifies the OTP provided by the user.
# If OTP is valid, the serializer returns the temporarily stored user details for creating the user in the database.


# get_404 

