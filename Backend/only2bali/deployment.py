import os
from .settings import *
from .settings import BASE_DIR

ALLOWED_HOSTS=['pybackend-eeamcqf4evb6hacn.centralindia-01.azurewebsites.net']
# Azure sets WEBSITE_HOSTNAME to the app's hostname; fall back to the known
# host so a missing env var can never crash startup (the previous code read an
# env var literally named after the hostname, which raised KeyError on boot).
_BACKEND_HOST = os.environ.get(
    'WEBSITE_HOSTNAME',
    'pybackend-eeamcqf4evb6hacn.centralindia-01.azurewebsites.net',
)
CSRF_TRUSTED_ORIGINS=['https://' + _BACKEND_HOST]
DEBUG=False
SECRET_KEY = os.environ['MY_SECRET_KEY']

MIDDLEWARE=[
    "django.middleware.security.SecurityMiddleware",
    # CorsMiddleware must precede any response-generating middleware
    # (WhiteNoise, CommonMiddleware) so CORS headers are attached.
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


CORS_ALLOWED_ORIGINS=[
    'https://happy-dune-02aab6b00.6.azurestaticapps.net',
    'https://polite-sand-06cb85900.6.azurestaticapps.net',
]
# Match the deployed frontend hostnames (Azure Static Web Apps and Vercel,
# including preview URLs). Restated here so the deployment config is
# self-contained.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.azurestaticapps\.net$",
    r"^https://.*\.vercel\.app$",
]

#DJANGO VERSION 4.2
STORAGES={
	"default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
	
}

CONNECTION = os.environ['AZURE_POSTGRESQL_CONNECTIONSTRING']
if not CONNECTION:
    raise ValueError("AZURE_POSTGRESQL_CONNECTIONSTRING environment variable is not set")

# Parse the connection string into a dictionary
CONNECTION_STR = {}

# Split by spaces to separate key-value pairs
for pair in CONNECTION.split(' '):
    key_value = pair.split('=')
    if len(key_value) == 2:
        CONNECTION_STR[key_value[0]] = key_value[1]
    else:
        raise ValueError(f"Invalid connection string format: {pair}")

# Now you can define your DATABASES configuration
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": CONNECTION_STR.get('dbname'),
        "HOST": 'localhost',
        "USER": CONNECTION_STR.get('user'),
        "PASSWORD": CONNECTION_STR.get('password'),
        "PORT": CONNECTION_STR.get('port', '5432'),  # Default to 5432 if not provided
    }
}

STATIC_ROOT = BASE_DIR/'staticfiles'
