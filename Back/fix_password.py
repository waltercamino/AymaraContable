from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
new_hash = pwd_context.hash("admin123")

print("✅ Nuevo hash para 'admin123':")
print(new_hash)
print("\n📋 Copia este hash para el UPDATE SQL")