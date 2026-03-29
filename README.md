ENV
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432

# pgAdmin
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin

# JWT Token
SECRET=my_super_secret_key_123

# Port
GATEWAY_PORT=8080
AUTH_PORT=8082
PET_PORT=8083
TRACKING_PORT=8081
NOTI_PORT=8084

# Database ของแต่ละ Service
AUTH_DB_DSN=host=postgres port=5432 user=postgres password=postgres dbname=auth_db sslmode=disable

PET_DB_DSN=host=postgres port=5432 user=postgres password=postgres dbname=pet_db sslmode=disable

TRACKING_DB_DSN=host=postgres port=5432 user=postgres password=postgres dbname=tracking_db sslmode=disable

# Ngrok 
NGROK_AUTHTOKEN=xxx
