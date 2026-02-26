import os
from datetime import timedelta

from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "..", ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")

    # Example: mysql://user:password@localhost:3306/grocery_store
    SQLALCHEMY_DATABASE_URI = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:Akash03dec05%40@localhost:3306/grocery_store",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-jwt")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)


def get_config():
    return Config()

