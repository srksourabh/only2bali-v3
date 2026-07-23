from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegistrationView.as_view(), name='register'),
    path('verify-otp/<str:mobile_number>/', OTPVerificationView.as_view(), name='verify_otp'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-verify/', PasswordResetVerifyView.as_view(), name='password_reset_verify'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='profile_update'),
    path('user-profile/', UserProfileView.as_view(), name='user-profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    # 'faq/' pushed straight into Zoho Desk with credentials that had been
    # committed publicly. Removed 2026-07-23. Its only caller — the contact form
    # in Frontend/src/FaqPage.js — was already commented out, so nothing broke.
    # Re-add it against a table we own, not a third party, before re-enabling.
]
